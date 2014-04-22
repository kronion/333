module.exports = function(client, cql) {
  var pages = function(req, res) {
    var query = 'SELECT user_id FROM users WHERE email=?';
    var params = [req.params.email];
    client.executeAsPrepared(query, params, cql.types.consistencies.one, 
                             function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        var user_id = result.rows[0].user_id;
        query = 'SELECT url FROM user_links WHERE user_id=?';
        params = [user_id];
        client.executeAsPrepared(query, params, cql.types.consistencies.one, 
                                 function(err, result) {
          if(err) {
            console.log(err);
          }
          else {
            var rows = result.rows;
            var links = [];

            for (var i = 0; i < rows.length; i++) {
              links[i] = rows[i].url;
            }

            query = 'SELECT img_url FROM user_links WHERE user_id=?';
            params = [user_id];
            client.executeAsPrepared(query, params, cql.types.consistencies.one, 
                                     function(err, result) {
              if(err) {
                console.log(err);
              }
              else {
                rows= result.rows;
                var image_sources = [];

                for (i = 0; i < rows.length; i++) {
                  image_sources[i] = rows[i].img_url;
                }
                res.render('profile.jade', { user: req.user, 
                                             links: links, 
                                             image_sources: image_sources
                });
              }
            });
          }
        });
      }
    });
  };
  return pages;
};
