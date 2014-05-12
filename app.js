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

/* Large string variables */
var strings = require('./strings.js');

/* Express */
var express = require('express');
var app = express();

/* Express-Mailer */
var mailer = require('express-mailer');
var email = require('./email.js');
mailer.extend(app, email);

/* S3 and multipart form data */
var busboy = require('connect-busboy');
var Uploader = require('s3-upload-stream').Uploader;
var uploadCreds = require('./uploadCreds.js');
var knox = require('knox');
// I hate this solution
var deleteCreds = require('./deleteCreds.js');
var knoxclient = knox.createClient(deleteCreds);
app.use(busboy());

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

/* bcrypt for password encryption */
var bcrypt = require('bcrypt');

/* Passport */
var passport = require('./routes/authenticate.js')(app, client, cql, bcrypt);

/* Jade templating */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals({
  title: '\'Chive',
  flash: {}
});

/* Routing */
var home = require('./routes/home.js')(client, cql);
var followers = require('./routes/followers.js')(client, cql);
var pages = require('./routes/pages.js')(client, cql);
var footer = require('./routes/footer.js')();

app.get('/', home);

app.post('/addFollower/:user_id', followers.addFollower);

app.post('/removeFollower/:user_id', followers.removeFollower);

// app.post('/removeLink', followers.removeLink);

app.post('/addLink', followers.addLink);

app.get('/pages/:user_id', pages);

/* Footer routes */
app.get('/about', footer.about);
app.get('/contact', footer.contact);
app.get('/help', footer.help);

app.get('/verify/:email/:ver_code', function (req, res) {
  var query = 'SELECT * FROM users where email=?';
  var params = [req.params.email];
  client.executeAsPrepared(query, params, cql.types.consistencies.one, function (err, result) {
    if (err) {
      console.error(err);
    }
    else {
      var rows = result.rows;
      var text;
      if (rows[0]) {
        if (rows[0].verified === true) {
          text = 'Your account is already verified!';
          res.render('verified.jade', {text: text});
        }
        else {
          if (rows[0].ver_code === req.params.ver_code) {
            query = 'UPDATE users SET verified=? WHERE user_id=?';
            params = [true, rows[0].user_id];
            client.executeAsPrepared(query, params, cql.types.consistencies.one, function (err) {
              if (err) {
                console.error(err);
              }
              else {
                text = 'Congratulations, your account is now verified!';
                res.render('verified.jade', {text: text});
              }
            });
          }
          else {
            text = 'Your verification code does not match!';
            res.render('verified.jade', {text: text});
          }
        }
      }
      else {
        text = 'You should not have reached this page!';
        res.render('verified.jade', {text: text});
      }
    }
  });
});

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

app.get('/signup', function(req, res) {
  res.render('signup.jade');
});

app.post('/signup', function(req, res) {
  var user_id = cql.types.uuid();
  var ver_code = cql.types.timeuuid();
  var query;
  var params;
  
  var response = {};
  if (req.body.email !== req.body.email2) {
    response.value=1;
    res.send(response);
  }
  else if (req.body.password !== req.body.password2) {
    response.value=2;
    res.send(response);
  }

  query = 'SELECT * FROM users WHERE email=?';
  params = [req.body.email];
  client.executeAsPrepared(query, params, cql.types.consistencies.one, function (err, result) {
    if (err) {
      console.error(err);
    }
    else {
      var rows = result.rows;
      if (rows[0]) {
        response.value=4;
        res.send(response);
      }
      else {
        bcrypt.hash(req.body.password, 10, function (err, hash) {
          if (err) {
            console.log(err);
          }
          query = 'INSERT INTO users (user_id, email, first_name, image, last_name, password, ver_code, verified) values (?,?,?,?,?,?,?,?)';
          params = [user_id, req.body.email, req.body.first_name, strings.anonymous,
                    req.body.last_name, hash, ver_code, false];
          client.executeAsPrepared(query, params, cql.types.consistencies.one, 
                                   function (err) {
            if (err) {
              console.log(err);
            }
            else {
              app.mailer.send('email', {
                to: req.body.email,
                subject:  'Welcome to \'Chive',
                ver_code: ver_code
              }, function (err) {
                if (err) {
                  console.error(err);
                }
              });
              response.value=3;
              res.send(response);
            }
          });
        });
      }
    }
  });
});

app.post('/upload/image/:user_id', function (req, res) {
  // Check that the post request was made by the user it affects
  if (req.user.user_id !== req.params.user_id) {
    // I think this will just stop fraudulent requests cold?
    res.end();
  }
  else {
    req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      // Check that the user posted an appropriate photo
      if (mimetype !== 'image/gif' && mimetype !== 'image/jpeg' &&
          mimetype !== 'image/png') {
        // Again, clobber fraudulent requests
        res.end();
      }
      else {
        // Delete old image if it exists
        var query = 'SELECT image FROM users WHERE user_id=?';
        var params = [req.params.user_id];
        client.executeAsPrepared(query, params, cql.types.consistencies.one,
                                 function (err, result) {
          if (err) {
            console.log(err);
          }
          else {
            var image = result.rows[0].image;
            if (image && image !== strings.anonymous) {
              knoxclient.deleteFile(image.substring(image.indexOf('/', 8)),
                                    function (err, res) {
                if (err) {
                  console.log(err);
                }
                else {
                  res.resume();
                }
              });
            }
          }
        });
        var UploadStreamObject = new Uploader(
          uploadCreds,
          {
            'Bucket': 'chive',
            'Key': req.user.user_id + Math.round(Math.random() * 1000000),
            'ACL': 'public-read'
          },
          function (err, uploadStream) {
            if (err) {
              console.log(err, uploadStream);
            }
            else {
              uploadStream.on('uploaded', function (data) {
                var query = 'UPDATE users SET image=? WHERE user_id=?';
                var params = [data.Location, req.params.user_id];
                client.executeAsPrepared(query, params, cql.types.consistencies.one,
                                         function (err) {
                  if (err) {
                    console.log(err);
                  }
                  else {
                    res.send(data.Location);
                  }
                });
              });
              file.pipe(uploadStream);
            }
          }
        );
      }
    });
    req.pipe(req.busboy);
  }
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
      if (rows[0]) {
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
          if (rows[0]) {
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
      if (rows[0]) {
        for (var i = 0; i < rows.length; i++) {
          search[i] = rows[i].email;
        }
      }
      res.send(JSON.stringify(search));
    }
  });
});

/* Create HTTP and HTTPS servers with Express object */
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
httpServer.listen(8080);
httpsServer.listen(8443);
