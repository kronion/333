module.exports = function(client, cql) {
//  var request = require('request');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  var bookmarklet = function(req, res) {
//    console.log(req.user);
    console.log("TESTING GET BOOKMARKLET outside");
    var link_uri = req.params.uri_enc;
    console.log(link_uri);
/*    request.post(
      'https://localhost:8443/addLink',
      { form: { addLink: link_uri }},
      function(error, response, body) {
         console.log(error);
//           console.log(response);
*/
      };
//    );
return bookmarklet;
  };
/*
  if(!req.user) {res.render('bookmarklet/login');}
  else { 
    request({
      uri: 'https://localhost/8443',
      method: 'POST',
      form: {
        addLink: link_uri
      }
    }, function(error, response, body) {
      console.log(body);
    });
    res.render('bookmarklet/submitted');
  } 
*/
/*    var query = 'SELECT url FROM user_links WHERE user_id=?';
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
                var row = result.rows[0];
                if (!row) {
                  // Should redirect to a search page
                  res.redirect('/');
                }
                else {
                  var image = row.image;

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
              }
            });
          }
        });
      }
    });
*/
