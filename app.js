/*
 * =============================================================================
 *
 *      Filename:   app.js
 *
 *   Description:   Root server file, acts as the point of connection between
 *                  client and routing logic.
 *
 *       Version:   0.0.1
 *       Created:   3/5/14 3:31:18 AM
 *
 *        Author:   Collin Stedman
 *
 * =============================================================================
 */

/* File system */
var fs = require('fs');
var path = require('path');

/* HTTP and HTTPS */
var http = require('http');
var https = require('https');

/* SSL files */
var privateKey = fs.readFileSync('server.key', 'utf8');
var certificate = fs.readFileSync('server.crt', 'utf8');
var pem_key = fs.readFileSync('pem_key', 'utf8');
var credentials = { 
  key: privateKey, 
  cert: certificate,
  passphrase: pem_key
};

/* Secret key to be used later */
var secret = require('./keyfile.js');

/* Strings */
var strings = require('./strings.js');

/* Express */
var express = require('express');
var app = express();

/* Our VPS is behind a reverse proxy */
app.enable('trust proxy');

/* Redirect HTTP to HTTPS */
app.use(function (req, res, next) {
  if (req.protocol === 'https') {
    next();
  }
  else {
    // Hardcoded port conversion, remove for live deployment
    var new_url = 'https://' + req.headers.host.slice(0, -5) + ':8443' + req.url;
    res.redirect(new_url);
  }
});

/* HSTS */
app.use(function (req, res, next) {
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return next();
});

/* DB and sessions */
var CasStore = require('connect-cassandra-cql')(express),
    cql = require('node-cassandra-cql'),
    CasClient = cql.Client;
var client = new CasClient({ hosts: ['localhost'], keyspace: 'getchive' });
var config = { client: client };
app.use(express.cookieParser())
   .use(express.json())
   .use(express.urlencoded())
   .use(express.session({
     secret: secret, 
     key: 'sid', 
     cookie: {
       secure: true
     },
     store: new CasStore(config)
   }));

/* Flash messages */
var flash = require('connect-flash');
app.use(flash());

/* Static file serving */
app.use(express.compress())
   .use(express.static(__dirname + '/public'));

/* Passport */
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    var query = 'SELECT * FROM users WHERE email=?';
    client.executeAsPrepared(query, [email], cql.types.consistencies.one, 
                             function (err, user) {
      if (err) { 
        return done(err); 
      }
      if (!user.rows[0]) {
        return done(null, false, { 'message': strings.incorrect_username }); 
      }
      if (user.rows[0].password != password) {
        return done(null, false, { 'message': strings.incorrect_password });
      }
      return done(null, user.rows[0]);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.user_id);
});
passport.deserializeUser(function(id, done) {
  var query = 'SELECT * FROM users WHERE user_id=?';
  client.executeAsPrepared(query, [id], cql.types.consistencies.one, function (err, user) {
    done(err, user.rows[0]);
  });
});
app.use(passport.initialize())
   .use(passport.session());

/* Jade templating */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals({
  title: 'GetChive',
  flash: {}
});

/* Routing */
app.get('/', function(req, res) {
  if (req.user) {
    res.render('home.jade');
  }
  else {
    res.render('front.jade');
  }
});

app.post('/', function(req, res) {
  if(req.body.addFollower) {
    var query = 'SELECT user_id FROM users WHERE email=?';
    var params = [req.body.addFollower];
    client.execute(query, params, cql.types.consistencies.one, function(err, result) {
      if(err) {console.log(err);}
      else {
        follower_id = result.rows[0].user_id;
        console.log(follower_id);
        var queries = [
          {
            query: 'INSERT INTO followers (user_id, follower_id) VALUES (?,?)',
            params: [req.user.user_id, follower_id]
          },
          {
            query: 'INSERT INTO followees (user_id, followee_id) VALUES (?,?)',
            params: [follower_id, req.user.user_id]
          }
        ];
        client.executeBatch(queries, cql.types.consistencies.one, function (err) {
          if (err) {console.log(err);}
          else {res.redirect('/');}
        });
      }
    });
  }

  if(req.body.removeFollower) {
    var query1 = 'SELECT user_id FROM users WHERE email=?';
    var params1 = [req.body.removeFollower];
    client.execute(query1, params1, cql.types.consistencies.one, function(err, result) {
      follower_id = result.rows[0].user_id;
      if(err) {console.log(err);}
      else {
        var queries1 = [
          {
            query: 'DELETE FROM followers WHERE user_id=? AND follower_id=?',
            params: [req.user.user_id, follower_id]
          },
          {
            query: 'DELETE FROM followees WHERE user_id=? AND followee_id=?',
            params: [follower_id, req.user.user_id]
          }
        ];
        client.executeBatch(queries1, cql.types.consistencies.one, function (err) {
          if (err) {console.log(err);}
          else {res.redirect('/');}
        });
      }
    });
  }

  if (req.body.addLink) {
    var link_id = cql.types.timeuuid();
    var queries2 = [
      {
        query: 'INSERT INTO global_links (link_id, url) VALUES (?,?)',
        params: [link_id, req.body.addLink]
      },
      {
        query: 'INSERT INTO user_links (user_id, link_id, url) VALUES (?,?,?)',
        params: [req.user.user_id, link_id, req.body.addLink]
      }
    ];
    client.executeBatch(queries2, cql.types.consistencies.one, function (err) {
      if (err) {console.log(err);}
      else {res.redirect('/');}
    });
  }
});

app.get('/pages/:name', function(req, res) {
  var query = 'SELECT * FROM user_links WHERE name=?';
  client.executeAsPrepared(query, [req.params.name], 
                           cql.types.consistencies.one, function (err, links) {
    if (err) {
      res.send('Error occurred: ' + err);
    }
    else {
      res.render('profile.jade', { links: links.rows });
    }
  });
});

app.get('/login', function(req, res) {
  var errors = req.flash();
  var results = [];
  if (errors.error) {
    for (var i = 0; i < errors.error.length; i++) {
      results.push(JSON.parse(errors.error[i]));
    }
  }
  res.render('login.jade', { flash: results });
});
app.post('/login', 
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true }));
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});
app.post('/signup', function(req, res) {
  var user_id = cql.types.uuid();
  var query = 'INSERT INTO users (user_id, email, password) values (?,?,?)';
  var params = [user_id, req.body.email, req.body.password];
  client.executeAsPrepared(query, params, cql.types.consistencies.one, function (err) {
    if (err) {
      console.log(err);
    }
    else {
      res.redirect('/');
    }
  });
});

/* Create HTTP and HTTPS servers with Express object */
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
httpServer.listen(8080);
httpsServer.listen(8443);
