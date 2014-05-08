/* Parsers & related modules */
var cheerio = require('cheerio');
var request = require('request');

module.exports = function(url, cb) {
  request(url, function(err, resp, html) {
    if (err) {
      console.error(err);
    }
    else {
      var $ = cheerio.load(html);
      var result = {};           // Parsed data will go here
      var split_array;
      var property;
      var name;
      var itemprop;
      var title;

      if($('meta')) {
        $('meta').each(function(i, elem) {

          /* Search for the properties attribute. This may or may not 
             contain information for opengraph (og). */
          property = $(elem).attr('property');
          if (property) {
            split_array = property.split(':');
            splitter(split_array, elem);
          }

          /* Search for the name attribute.  This may or may not contain
             information for twitter and a generic description. */
          name = $(elem).attr('name');
          if (name) {
            split_array = name.split(':');
            splitter(split_array, elem);
          }

          /* Search for the itemprop attribute.  This may or may not
             contain an image (e.g., favicon) for sites similar to 
             Google. */
          itemprop = $(elem).attr('itemprop');
          if (itemprop) {
            split_array = itemprop.split(':');
            splitter(split_array, elem);
          }

        });
      }

      title = $('title').first().text();
      if (title) {
        result['title'] = title;
      }

      function splitter(split_array, elem) {
        var parent = result;

        for (var i = 0; i < split_array.length; i++) {
          var token = split_array[i];

          if (i+1 == split_array.length) {
            var content = $(elem).attr('content');

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
      var json = JSON.parse(JSON.stringify(result, null, '\t'));
      cb(json);
    }
  });
}
