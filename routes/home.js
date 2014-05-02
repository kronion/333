/* Priority Queue for EdgeRank */
var PriorityQueue = require('priorityqueuejs');

module.exports = function(client, cql) {
  var route = function(req, res) {
    if (req.user) {
      var query = 'SELECT * FROM timeline WHERE user_id = ?';
      var params = [req.user.user_id];
      var links = [];
      var image_sources = [];
      var timedecay = [];
      var json = [];
      client.executeAsPrepared(query, params, cql.types.consistencies.one, 
                               function(err, result) {
        if (err) {
          console.log(err);
        }
        else {
          var rows = result.rows;
          if (rows) {
            for (var i = 0; i < rows.length; i++) {
              var dict = {};
              dict.id = rows[i].user_link_id;
              dict.url = rows[i].url;
              dict.image = rows[i].img_url;
              dict.descrip = rows[i].descrip;
              json[i] = dict;
              links[i] = rows[i].url;
              image_sources[i] = rows[i].img_url;
            }
            query = 'SELECT dateOf(user_link_id) FROM timeline where user_id =?';
            params = [req.user.user_id];
            client.executeAsPrepared(query, params, cql.types.consistencies.one, 
                                     function(err, result) {
              if (err) {
                 console.log(err);
              }
              else {
                var rows = result.rows;
                if (rows) {
                  var queue = new PriorityQueue(function(a, b) {
                    return a.timedecay - b.timedecay;
                  });
                  for (var i = 0; i < rows.length; i++) {
                    timedecay[i] = 1/(Date.now() - rows[i]['dateOf(user_link_id)']);
                    queue.enq({timedecay: timedecay[i], 
                               link: links[i], 
                               image: image_sources[i]
                    });
                  }
                }
              }
            });
            res.render('home.jade', { user: req.user, 
                                      json: json
            });
          }
        }
      });
    }
    else {
      res.render('front.jade');
    }
  };
  return route;
};
