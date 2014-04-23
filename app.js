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

var PriorityQueue = require('priorityqueuejs');

/* File system */
var fs = require('fs');
var path = require('path');

/* Parsers & related modules */
var cheerio = require('cheerio');
var request = require('request');
var oembed = require('oembed');

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
    // var query = 'SELECT url FROM user_links WHERE user_id=?';
    // var params = [req.user.user_id];
    // var links = [];
    // var image_sources = [];
    // client.execute(query, params, cql.types.consistencies.one, function(err, result) {
    //   if(err) {console.log(err);}
    //   else {
    //     var rows = result.rows;
        
    //     if (rows) {
    //       for (var i = 0; i < rows.length; i++) {
    //         links[i] = rows[i].url;
    //       }

    //       query = 'SELECT img_url FROM user_links WHERE user_id=?';
    //       params = [req.user.user_id];
    //       client.execute(query, params, cql.types.consistencies.one, function(err, result) {
    //         if(err) {console.log(err);}
    //         else {
    //           rows= result.rows;

    //           for (i = 0; i < rows.length; i++) {
    //             image_sources[i] = rows[i].img_url;
    //           }
    //           res.render('home.jade', {links: links, image_sources: image_sources});
    //         }
    //       });
    //     }
    //     else {
    //       res.render('home.jade', {links: links, image_sources: image_sources});
    //     }
    //   }
    // });

    var query = 'SELECT * FROM timeline WHERE user_id=?';
    var params = [req.user.user_id];
    var links = [];
    var image_sources = [];
    var timedecay = [];
    client.execute(query, params, cql.types.consistencies.one, function(err, result) {
      if (err) {console.log(err);}
      else {
        var rows = result.rows;
        if (rows) {
          for (var i = 0; i < rows.length; i++) {
            links[i] = rows[i].url;
            image_sources[i] = rows[i].img_url;
          }
        }
        query = 'SELECT dateOf(user_link_id) FROM timeline WHERE user_id=?';
        params = [req.user.user_id];
        client.execute(query, params, cql.types.consistencies.one, function(err, result) {
          if (err) {console.log(err);}
          else {
            var rows = result.rows;
            if (rows) {
              var queue = new PriorityQueue(function(a, b) {
                return a.timedecay - b.timedecay;
              });
              for (var i = 0; i < rows.length; i++) {
                timedecay[i] = 1/(Date.now()-rows[i]['dateOf(user_link_id)']);
                queue.enq({timedecay: timedecay[i], link: links[i], image: image_sources[i]});
              }
              console.log('Priority queue updated');
            }
          }
        });

        res.render('home.jade', {links: links, image_sources: image_sources});
      }
    });
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
        var follower_id = result.rows[0].user_id;
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
      var follower_id = result.rows[0].user_id;
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
    var url = req.body.addLink;

    var query2 = 'SELECT link_id FROM url_to_links WHERE url=?';
    var params2 = [url];
    client.execute(query2, params2, cql.types.consistencies.one, function(err, result) {
      if (err) {console.log(err);}

      else {
        if (result.rows[0]) {
          var link_id = result.rows[0].link_id;

          query2 = 'SELECT img_url, descrip FROM global_links WHERE link_id=?';
          params2 = [link_id];

          client.execute(query2, params2, cql.types.consistencies.one, function(err, result) {
            if (err) {console.log(err);}

            else {
              var img_url = result.rows[0].img_url;
              var descrip = result.rows[0].descrip;
              var user_link_id = cql.types.timeuuid();

              query2 = 'INSERT INTO user_links (user_id, user_link_id, url, img_url, descrip) VALUES (?,?,?,?,?)';
              params2 = [req.user.user_id, user_link_id, url, img_url, descrip];

              client.execute(query2, params2, cql.types.consistencies.one, function(err) {
                if (err) {console.log(err);}
                else {
                  query2 = 'INSERT INTO user_link_id_to_user (user_link_id, user_id) VALUES (?,?)';
                  params2 = [user_link_id, req.user.user_id];
                  client.execute(query2, params2, cql.types.consistencies.one, function(err) {
                    if (err) {console.log(error);}
                    else {
                      console.log('user_links & user_link_id_to_user table updated');
                      query2 = 'SELECT * FROM followees WHERE user_id=?';
                      params2 = [req.user.user_id];
                      client.execute(query2, params2, cql.types.consistencies.one,
                        function(err, result) {
                          if (err) {console.log(err);}
                          else {
                            var rows = result.rows;
                            if (rows) {
                              for (var i = 0; i < rows.length; i++) {
                                query2 = 'INSERT INTO timeline (user_id, user_link_id, owner_id, url, img_url, descrip) VALUES (?,?,?,?,?,?)';
                                params2 = [rows[i].followee_id, user_link_id, req.user.user_id, url, img_url, descrip];
                                client.execute(query2, params2, cql.types.consistencies.one,
                                  function(err) {
                                    if (err) {console.log(err);}
                                    else {
                                      console.log('Successfully inserted into followees timeline');
                                    }
                                  });
                              }
                            }
                          }
                        });
                    }
                  });
                  
                }
              });
            }
          });
        }


        else {
          request(url, function(err, resp, html) {
            if (err) return console.error(err);

            var $ = cheerio.load(html);

            // Our parsed data will go here
            var result = {};

            $('meta').each(function(i, elem) {
              var property = $(this).attr('property');
              if (property) {
                var propsplit = property.split(':');
                var parent = result;

                for (var j = 0; j < propsplit.length; j++) {
                  var token = propsplit[j];

                  if (j+1 == propsplit.length) {
                    var content = $(this).attr('content');

                    if (!parent[token]) {
                      parent[token] = content;
                    }
                    else {
                      if (Array.isArray(parent[token])) {
                        parent[token].push(content);
                      }
                      else {
                        var childarray = [parent[token], content];
                        parent[token] = childarray;
                      }
                    }
                  }
                  else {
                    if (!parent[token]) {
                      parent[token] = {};
                    }
                    parent = parent[token];
                  }
                }
              }
            });
            var json = JSON.parse(JSON.stringify(result, null, '\t'));

            var link_id = cql.types.timeuuid();
            var user_link_id = cql.types.timeuuid();
            var img_url = json.og.image;
            var descrip = json.og.description;

            var queries2 = [
              {
                query: 'INSERT INTO global_links (link_id, url, img_url, descrip) VALUES (?,?,?,?)',
                params: [link_id, url, img_url, descrip]
              },
              {
                query: 'INSERT INTO user_links (user_id, user_link_id, url, img_url, descrip) VALUES (?,?,?,?,?)',
                params: [req.user.user_id, user_link_id, url, img_url, descrip]
              },
              {
                query: 'INSERT INTO url_to_links (url, link_id) VALUES (?,?)',
                params: [url, link_id]
              },
              {
                query: 'INSERT INTO user_link_id_to_user (user_link_id, user_id) VALUES (?,?)',
                params: [user_link_id, req.user.user_id]
              }
            ];
            client.executeBatch(queries2, cql.types.consistencies.one, function (err) {
              if (err) {console.log(err);}
              else {
                console.log('parsed and updated everything (now with user_link_ids)');
                query2 = 'SELECT * FROM followees WHERE user_id=?';
                params2 = [req.user.user_id];
                client.execute(query2, params2, cql.types.consistencies.one,
                  function(err, result) {
                    if (err) {console.log(err);}
                    else {
                      var rows = result.rows;
                      if (rows) {
                        for (var i = 0; i < rows.length; i++) {
                          query2 = 'INSERT INTO timeline (user_id, user_link_id, owner_id, url, img_url, descrip) VALUES (?,?,?,?,?,?)';
                          params2 = [rows[i].followee_id, user_link_id, req.user.user_id, url, img_url, descrip];
                          client.execute(query2, params2, cql.types.consistencies.one,
                            function(err) {
                              if (err) {console.log(err);}
                              else {
                                console.log('Successfully inserted into followees timeline');
                              }
                            });
                        }
                      }
                    }
                  });
              }
            });
          });
        }
        res.redirect('/');
      }
    });
  }
});

app.get('/home', function(req, res) {
  res.redirect('/pages/'+req.user.email);
});

app.get('/pages/:email', function(req, res) {
  var query = 'SELECT user_id FROM users WHERE email=?';
  var params = [req.params.email];
  client.execute(query, params, cql.types.consistencies.one, function (err, result) {
    if (err) {console.log(err);}
    else {
      var user_id = result.rows[0].user_id;
      query = 'SELECT url FROM user_links WHERE user_id=?';
      params = [user_id];
      client.execute(query, params, cql.types.consistencies.one, function(err, result) {
        if(err) {console.log(err);}
        else {
          var rows = result.rows;
          var links = [];
          
          if (rows) {
            for (var i = 0; i < rows.length; i++) {
              links[i] = rows[i].url;
            }

            query = 'SELECT img_url FROM user_links WHERE user_id=?';
            params = [user_id];
            client.execute(query, params, cql.types.consistencies.one, function(err, result) {
              if(err) {console.log(err);}
              else {
                rows= result.rows;
                var image_sources = [];

                for (i = 0; i < rows.length; i++) {
                  image_sources[i] = rows[i].img_url;
                }
                res.render('profile.jade', {links: links, image_sources: image_sources});
              }
            });
          }
          else {
            res.send("No links to show");
          }
        }
      });
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
