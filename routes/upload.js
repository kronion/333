/* S3 and multipart form data */
var busboy = require('connect-busboy');
var Uploader = require('s3-upload-stream').Uploader;
var uploadCreds = require('../uploadCreds.js');
var knox = require('knox');
// I hate this solution
var deleteCreds = require('../deleteCreds.js');
var knoxclient = knox.createClient(deleteCreds);

module.exports = function(app, client, cql, strings) {
  app.use(busboy());
  var image = function (req, res) {
    // Check that the post request was made by the user it affects
    if (req.user.user_id !== req.params.user_id) {
      // I think this will just stop fraudulent requests cold?
      res.end();
    }
    else {
      req.busboy.on('file', function(fieldname, file, filename, encoding, 
                                     mimetype) {
        // Check that the user posted an appropriate photo
        if (mimetype !== 'image/gif' && mimetype !== 'image/jpeg' &&
            mimetype !== 'image/png') {
          // Again, clobber fraudulent requests
          res.end();
        }
        else {
          // Delete old image if it exists
          var query = 'SELECT image FROM users WHERE user_id=?';
          var params = [req.params.user_id];
          client.executeAsPrepared(query, params, cql.types.consistencies.one,
                                   function (err, result) {
            if (err) {
              console.log(err);
            }
            else {
              var image = result.rows[0].image;
              if (image && image !== strings.anonymous) {
                knoxclient.deleteFile(image.substring(image.indexOf('/', 8)),
                                      function (err, res) {
                  if (err) {
                    console.log(err);
                  }
                  else {
                    res.resume();
                  }
                });
              }
            }
          });
          var UploadStreamObject = new Uploader(
            uploadCreds,
            {
              'Bucket': 'chive',
              // Should probably hash instead?
              'Key': req.user.user_id + Math.round(Math.random() * 1000000),
              'ACL': 'public-read'
            },
            function (err, uploadStream) {
              if (err) {
                console.log(err, uploadStream);
              }
              else {
                uploadStream.on('uploaded', function (data) {
                  var query = 'UPDATE users SET image=? WHERE user_id=?';
                  var params = [data.Location, req.params.user_id];
                  client.executeAsPrepared(query, params, 
                                           cql.types.consistencies.one,
                                           function (err) {
                    if (err) {
                      console.log(err);
                    }
                    else {
                      res.send(data.Location);
                    }
                  });
                });
                file.pipe(uploadStream);
              }
            }
          );
        }
      });
      req.pipe(req.busboy);
    }
  };
  return { image: image };
};
