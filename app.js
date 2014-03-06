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

/* Secret key to be used later */
var secret = require('./keyfile.js');

/* Express */
var express = require('express');
var app = express();

/* Static file serving */
app.use(express.compress())
   .use(express.static(__dirname + '/public'));

/* Sessions */
app.use(express.cookieParser())
   .use(express.json())
   .use(express.urlencoded())
   .use(express.session({
     secret: secret, 
     key: 'sid', 
     cookie: { 
       secure: true
     }
   }));

/* Passport */
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
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
app.listen(1337);
