module.exports = function(client, cql) {
  var pages = function(req, res) {
    var query = 'SELECT url FROM user_links WHERE user_id=?';
    var params = [req.params.user_id];
    client.executeAsPrepared(query, params, cql.types.consistencies.one, 
                             function(err, result) {
      if(err) {
        // console.log(err);
        // Should redirect to a search page
        res.redirect('/');
      }
      else {
        var user_id = result.rows[0].user_id;
        query = 'SELECT * FROM user_links WHERE user_id=?';
        params = [user_id];
        client.executeAsPrepared(query, params, cql.types.consistencies.one, 
                                 function(err, result) {
          if(err) {
            console.log(err);
          }
          else {
            var rows = result.rows;
            var json = [];
            if (rows[0]) {
              for (var i = 0; i < rows.length; i++) {
                var dict = {};
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
                var row = result.rows[0];
                if (!row) {
                  // Should redirect to a search page
                  res.redirect('/');
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
                  res.render('profile.jade', { user: req.user, 
                                               editable: editable,
                                               name: name,
                                               image: image,
                                               links: links, 
                                               json: json
                  });
                }
              }
            });
          }
        });
      }
    });
  };
  return pages;
};
