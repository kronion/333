/*
 * =============================================================================
 *
 *      Filename:   app.js
 *
 *   Description:   Root server file, acts as the point of connection between
 *                  client and routing logic.
 *
 *      Version:    0.0.1
 *      Created:    3/5/14 3:31:18 AM
 *
 *       Author:    Collin Stedman
 *
 * =============================================================================
 */

/* File system */
var fs = require('fs');

/* HTTPS */
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

/* Express */
var express = require('express');
var app = express();

/* HSTS */
app.use(function (req, res, next) {
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return next();
});

/* Static file serving */
app.use(express.compress())
   .use(express.static(__dirname + '/public'));

/* DB and sessions */
var CasStore = require('connect-cassandra-cql')(express),
    CasClient = require('node-cassandra-cql').Client;
var client = new CasClient({ hosts: ['localhost'], keyspace: 'blabrr' });
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

/* Passport */
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(
  function(username, password, done) {
    var query = 'SELECT * FROM users WHERE username=?';
    client.executeAsPrepared(query, username, function (err, user) {
      if (err) { 
        return done(err); 
      }
      if (!user) {
        return done(null, false, { message: 'Incorrect username or password.' });
      }
      if (user.password != password) {
        return done(null, false, { message: 'Incorrect password or password.' });
      }
      return done(null, user);
    });
  }
));

app.use(passport.initialize())
   .use(passport.session());

/* Jade templating */
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

/* Routing */
app.get('/', function(req, res) {
  res.send('Hello World!');
});
app.get('/test', function(req, res) {
  res.render('layout.jade');
});
app.get('/route', function(req, res) {
  console.log(req.session);
  res.write('Response: ' + req.session.test);
  req.session.test = 'Test';
  res.end();
  console.log(req.session);
});
app.get('/route2', function(req, res) {
  console.log(req.session);
  res.write('Response: ' + req.session.test);
  req.session.test = 'Test2';
  res.end();
  console.log(req.session);
});

app.post('/login', 
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true }));

/* Create HTTPS server with Express object */
var httpsServer = https.createServer(credentials, app);

httpsServer.listen(1337);
