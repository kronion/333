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
            res.render('profile.jade', { user: req.user,
                                         json: json
            });
          }
        });
      }
    });
  };
  return pages;
};
