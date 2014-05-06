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
var db = require('./models/db.js');
db.configure(app, express);
var client = db.client;
var cql = db.cql;

/* Flash messages */
var flash = require('connect-flash');
app.use(flash());

/* Static file serving */
app.use(express.compress());
app.use(express.static(__dirname + '/public'));

/* Passport */
var passport = require('./routes/authenticate.js')(app, client, cql);

/* Jade templating */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals({
  title: 'GetChive',
  flash: {}
});

/* Routing */
var home = require('./routes/home.js')(client, cql);
var followers = require('./routes/followers.js')(client, cql);
var pages = require('./routes/pages.js')(client, cql);

app.get('/', home);

app.post('/addFollower', followers.addFollower);

app.post('/removeFollower', followers.removeFollower);

app.post('/addLink', followers.addLink);

app.get('/pages/:email', pages);

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook',
  passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));

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

/* This section is for commenting capabilities */
app.get('/comments/:id', function(req, res) {
  var comments = [];
  var query = 'SELECT * FROM comments WHERE user_link_id=?';
  var params = [req.params.id];
  client.executeAsPrepared(query, params, cql.types.consistencies.one, function(err, result) {
    if (err) {
      console.log(err);
    }
    else {
      var rows = result.rows;
      if (rows) {
        for (var i = 0; i < rows.length; i++) {
          var dict = {};
          dict.author = rows[i].author;
          dict.text = rows[i].body;
          comments[i] = dict;
        }
      }
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(comments));
    }
  });
});

app.post('/comments/:id', function(req, res) {
  var comment_id = cql.types.timeuuid();
  var query = 'INSERT INTO comments (user_link_id, comment_id, user_id, author, body) values (?,?,?,?,?)';
  var params = [req.params.id, comment_id, req.user.user_id, req.user.email, req.body.text];
  client.executeAsPrepared(query, params, cql.types.consistencies.one, function(err) {
    if (err) {
      console.log(err);
    }
    else {
      var comments = [];
      var query = 'SELECT * FROM comments WHERE user_link_id=?';
      var params = [req.params.id];
      client.executeAsPrepared(query, params, cql.types.consistencies.one, function(err, result) {
        if (err) {
          console.log(err);
        }
        else {
          var rows = result.rows;
          if (rows) {
            for (var i = 0; i < rows.length; i++) {
              var dict = {};
              dict.author = rows[i].author;
              dict.text = rows[i].body;
              comments[i] = dict;
            }
          }
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify(comments));
        }
      });
    }
  });
});

app.get('/autocomp', function(req,res) {
  var search =[];
  var query = 'SELECT email FROM users';
  client.executeAsPrepared(query, cql.types.consistencies.one, function(err, result) {
    if (err) {
      console.log(err);
    }
    else {
      var rows = result.rows;
      if (rows) {
        for (var i = 0; i < rows.length; i++) {
          search[i] = rows[i].email;
        }
      }
      res.send(JSON.stringify(search));
    }
  });
});

app.get('')

/* Create HTTP and HTTPS servers with Express object */
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
httpServer.listen(8080);
httpsServer.listen(8443);
