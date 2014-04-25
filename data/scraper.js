/* Parsers & related modules */
var cheerio = require('cheerio');
var request = require('request');

module.exports = function(url, cb) {
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
    cb(json);
  });
}
