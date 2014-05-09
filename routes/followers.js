/* Web scraper */
var scraper = require('../data/scraper.js');

module.exports = function (client, cql) {
  var addFollower = function (req, res) {
    var query = 'SELECT user_id FROM users WHERE email=?';
    var params = [req.body.addFollower];
    client.execute(query, params, cql.types.consistencies.one,
                   function (err, result) {
      if(err) {
        console.log(err);
      }
      else {
        var follower_id = result.rows[0].user_id;
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
        client.executeBatch(queries, cql.types.consistencies.one,
                            function (err) {
          if (err) {
            console.log(err);
          }
          else {
            res.redirect('/');
          }
        });
      }
    });
  };
  var removeFollower = function(req, res) {
    var query1 = 'SELECT user_id FROM users WHERE email=?';
    var params1 = [req.body.removeFollower];
    client.execute(query1, params1, cql.types.consistencies.one,
                   function(err, result) {
      var follower_id = result.rows[0].user_id;
      if(err) {
        console.log(err);
      }
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
        client.executeBatch(queries1, cql.types.consistencies.one,
                            function (err) {
          if (err) {
            console.log(err);
          }
          else {
            res.redirect('/');
          }
        });
      }
    });
  };
  /*var removeLink = function(req, res) {
    var url = req.body.removeLink;
    var query = 'SELECT link_id FROM url_to_links WHERE url=?';
    var params = [url];
    client.executeAsPrepared(query, params, cql.types.consistencies.one,
                             function(err, result) {
      if (err) {
        console.log(err);
      }
      else {
        var rows = result.rows;
        if (rows[0]) {
          var link_id = rows[0].link_id;
          var queries = [
            {
              query: 'DELETE FROM user_links WHERE user_id=? AND user_link_id=?',
              params: [req.user.user_id, link_id]
            },
            {
              query: 'DELETE FROM user_link_id_to_user WHERE user_link_id=?',
              params: [link_id]
            },
            {
              query: 'DELETE FROM timeline WHERE user_id=? AND user_link_id=?',
              params: [req.user.user_id, link_id]
            }
          ];
          client.executeBatch(queries, cql.types.consistencies.one, function(err) {
            if (err) {
              console.log(err);
            }
            else {
              console.log("removed Link");
              res.redirect('/');
            }
          });
        }
      }
    });
  };*/
  var addLink = function (req, res) {
    var rows;
    var url;
    var query;
    var params;

    /* Obtain the url from the form or from one's timeline. */
    if (req.body.addLink) {
      url = req.body.addLink;
    }
    else if (req.body.url) {
      url = req.body.url;
    }
    query = 'SELECT link_id FROM url_to_links WHERE url=?';
    params = [url];
    client.executeAsPrepared(query, params, cql.types.consistencies.one, 
                             function(err, result) {
      if (err) {
        console.log(err);
      }
      else {
        rows = result.rows;
        if (rows[0]) {
          var link_id = rows[0].link_id;
          query = 'SELECT * FROM global_links WHERE link_id=?';
          params = [link_id];
          client.executeAsPrepared(query, params, cql.types.consistencies.one,
                                   function(err, result) {
            if (err) {
              console.log(err);
            }
            else {
              rows = result.rows;
              var img_url = rows[0].img_url;
              var descrip = rows[0].descrip;
              var title = rows[0].title;
              var user_link_id = cql.types.timeuuid();
              query = 'INSERT INTO user_links (user_id, user_link_id, url, img_url, descrip, title) VALUES (?,?,?,?,?,?)';
              params = [req.user.user_id, user_link_id, url, img_url, descrip, title];

              client.executeAsPrepared(query, params, cql.types.consistencies.one,
                                       function(err) {
                if (err) {
                  console.log(err);
                }
                else {
                  query = 'INSERT INTO user_link_id_to_user (user_link_id, user_id) VALUES (?,?)';
                  params = [user_link_id, req.user.user_id];
                  client.execute(query, params, cql.types.consistencies.one,
                                 function(err) {
                    if (err) {
                      console.log(err);
                    }
                    else {
                      query = 'SELECT * FROM followees WHERE user_id = ?';
                      params = [req.user.user_id];
                      client.execute(query, params, cql.types.consistencies.one,
                                     function (err, result) {
                        if (err) {
                          console.log(err);
                        }
                        else {
<<<<<<< HEAD
                          rows = result.rows;
                          if (rows[0]) {
                            console.log(req.user.email);
                            for (var i = 0; i < rows.length; i++) {
                              query = 'INSERT INTO timeline (user_id, user_link_id, owner_id, owner_first_name, owner_last_name, owner_email, url, img_url, descrip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                              params = [rows[i].followee_id, user_link_id, req.user.user_id, req.user.first_name, req.user.last_name, req.user.email, url, img_url, descrip];
                              client.execute(query, params,
                                             cql.types.consistencies.one,
                                             function(err) {
                                if (err) {
                                  console.error(err);
                                }
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
          scraper(url, function(json) {

            /* Create timeuuids for the global link and user link table. */
            var link_id = cql.types.timeuuid();
            var user_link_id = cql.types.timeuuid();

            /* Set the default image and description and title. */
            var img_url = 'http://www.aof-clan.com/AoFWiki/images/6/60/No_Image_Available.png';
            var descrip = 'No description available';
            var title = 'No title';

            /* Check the results of the scraper for the image and description
               and whatever other values that one needs. */
            if (json.title) {
              title = json.title;
            }
            else if (json.og) {
              if (json.og.title) {
                title = json.og.title;
              }
            }
            else if (json.twitter) {
              if (json.twitter.title) {
                title = json.twitter.title;
              }
            }

            if (json.description) {
              descrip = json.description+'...';
            }
            else if (json.og) {
              if (json.og.description) {
                descrip = json.og.description+'...';
              }
            }
            else if (json.twitter) {
              if (json.twitter.description) {
                descrip = json.twitter.description+'...';
              }
            }

            if (json.image) {
              /* Scraping Google.com for an image only provides the ending
                 to the HTTP address, and therefore this image address must
                 be appended to the url. */
              img_url = url+json.image;
            }
            else if (json.og) {
              if (json.og.image) {
                img_url = json.og.image;
              }
            }
            else if (json.twitter) {
              if (json.twitter.image) {
                img_url = json.twitter.image;
              }
            }

            var queries = [
              {
                query: 'INSERT INTO global_links (link_id, url, img_url, descrip, title) VALUES (?,?,?,?,?)',
                params: [link_id, url, img_url, descrip, title]
              },
              {
                query: 'INSERT INTO user_links (user_id, user_link_id, url, img_url, descrip, title) VALUES (?,?,?,?,?,?)',
                params: [req.user.user_id, user_link_id, url, img_url, descrip, title]
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
            client.executeBatch(queries, cql.types.consistencies.one,
                                function (err) {
              if (err) {
                console.error(err);
              }
              else {
                console.log('NEW link successfully inserted');
                query = 'SELECT * FROM followees WHERE user_id = ?';
                params = [req.user.user_id];
                client.executeAsPrepared(query, params, cql.types.consistencies.one,
                                         function (err, result) {
                  if (err) {
                    console.error(err);
                  }
                  else {
                    rows = result.rows;
                    if (rows[0]) {
                      for (var i = 0; i < rows.length; i++) {
                        query = 'INSERT INTO timeline (user_id, user_link_id, owner_id, owner_first_name, owner_last_name, owner_email, url, img_url, descrip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                              params = [rows[i].followee_id, user_link_id, req.user.user_id, req.user.first_name, req.user.last_name, req.user.email, url, img_url, descrip];
                        client.executeAsPrepared(query, params, cql.types.consistencies.one,
                                                 function(err) {
                          if (err) {
                            console.error(err);
                          }
                          else {
                            console.log('Followees timeline updated with NEW link');
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
      }
      res.redirect('/');
    });
  };
  return { addLink: addLink,
           addFollower: addFollower,
           removeFollower: removeFollower,
           //removeLink: removeLink
         };
};
