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
        var rows = result.rows;
        var links = [];

        for (var i = 0; i < rows.length; i++) {
          links[i] = rows[i].url;
        }

        query = 'SELECT img_url FROM user_links WHERE user_id=?';
        params = [req.params.user_id];
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

            query = 'SELECT image FROM users WHERE user_id=?';
            params = [req.params.user_id];
            client.executeAsPrepared(query, params, cql.types.consistencies.one,
                                     function (err, result) {
              if (err) {
                console.log(err);
              }
              else {
                var image = result.rows[0].image;

                // Do something more resilient here
                var editable = false;
                if (req.user.user_id === req.params.user_id) editable = true;
                  res.render('profile.jade', { user: req.user, 
                                               editable: editable,
                                               image: image,
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
