module.exports = function(client, cql) {
  var pages = function(req, res) {
    var user_id = req.params.user_id;
    var query = 'SELECT * FROM user_links WHERE user_id=?';
    var params = [user_id];
    client.executeAsPrepared(query, params, cql.types.consistencies.one, 
                             function(err, result) {
      if(err) {
        // console.log(err);
        // Should redirect to a search page
        res.send(404);
      }
      else {
        var rows = result.rows;
        var json = [];
        if (rows[0]) {
          for (var i = 0; i < rows.length; i++) {
            var dict = {};
            dict.id = rows[i].user_link_id;
            dict.url = rows[i].url;
            dict.image = rows[i].img_url;
            dict.descrip = rows[i].descrip;
            dict.title = rows[i].title;
            json[i] = dict;
          }
        }
        query = 'SELECT first_name, last_name, image FROM users WHERE user_id=?';
        params = [user_id];
        client.executeAsPrepared(query, params, cql.types.consistencies.one,
                                 function (err, result) {
          if (err) {
            console.log(err);
          }
          else {
            row = result.rows[0];
            if (!row) {
              // Should redirect to a search page
              res.send(404);
            }
            else {
              var image = row.image;
              var name = { first_name: row.first_name,
                           last_name: row.last_name };

              // Do something more resilient here
              var editable = false;
              if (req.user) {
                if (req.user.user_id === req.params.user_id) {
                  editable = true;
                }
              }
              query = 'SELECT * FROM followers WHERE user_id=?';
              params = [req.user.user_id];
              client.executeAsPrepared(query, params, cql.types.consistencies.one,
                                       function (err, results) {
                if (err) {
                  console.log(err);
                }
                else {
                  rows = results.rows;
                  var followed = false;
                  for (var i = 0; i < rows.length; i++) {
                    if (user_id === rows[i].follower_id) {
                      followed = true;
                      break;
                    }
                  }
                  res.render('profile.jade', { user: req.user, 
                                               editable: editable,
                                               user_id: user_id,
                                               name: name,
                                               image: image,
                                               followed: followed,
                                               json: json
                  });
                }
              });
            }
          }
        });
      }
    });
  };
  return pages;
};
