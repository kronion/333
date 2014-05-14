/* Strings */
var strings = require('../strings.js');

module.exports = function(app, client, cql, bcrypt) {
  /* Passport */
  var passport = require('passport');
  var LocalStrategy = require('passport-local').Strategy;
  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, done) {
      var query = 'SELECT * FROM users WHERE email=?';
      client.executeAsPrepared(query, [email], cql.types.consistencies.one,
                               function (err, user) {
        if (err) {
          return done(err);
        }
        if (!user.rows[0]) {
          return done(null, false, { 'message': strings.incorrect_username });
        }
        bcrypt.compare(password, user.rows[0].password, function (err, res) {
          if (err) {
            return done(err);
          }
          if (!res) {
            return done(null, false, { 'message': strings.incorrect_password });
          }
          if (user.rows[0].verified === false) {
            return done(null, false, { 'message': strings.unverified });
          }
          return done(null, user.rows[0]);
        });
      });
    }
  ));

  var FacebookStrategy = require('passport-facebook').Strategy;

  passport.use(new FacebookStrategy({
      clientID: '656697897711155',
      clientSecret: 'da59fa7c8e4cc617c40793b45ac31b97',
      callbackURL: app.locals.domain + '/auth/facebook/callback'
    },
    function(accessToken, refreshToken, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {
        var query0 = 'SELECT * FROM users WHERE email = ?';
        client.executeAsPrepared(query0, [profile.username], cql.types.consistencies.one, function(err, result) {
          if (err) {
            return done(err);
          }
          else if (result.rows[0]) {
            var query1 = 'SELECT * FROM users WHERE email = ?';
            client.executeAsPrepared(query1, [profile.username], cql.types.consistencies.one, function(err, user) {
              if (err) {
                return done(err);
              }
              else {
                return done(null, user.rows[0]);
              }
            });
          }
          else {
            var user_id = cql.types.uuid();

            var query2 = 'INSERT INTO users (user_id, fbid, email, first_name, image, last_name) values (?, ?, ?, ?, ?, ?)';

            client.executeAsPrepared(query2, [user_id, profile.id, profile.username,
                                     profile.name.givenName, strings.anonymous, 
                                     profile.name.familyName], 
                                     cql.types.consistencies.one, 
                                     function(err, result) {
              if (err) {
                return done(err);
              }
              else {
                query1 = 'SELECT * FROM users WHERE email = ?';
                client.executeAsPrepared(query1, [profile.username], 
                               cql.types.consistencies.one, function (err, user) {
                  if (err) {
                    return done(err);
                  }
                  else {
                    return done(null, user.rows[0]);
                  }
                });
              }
            });
          }
        });
      });
    }
  ));

  passport.serializeUser(function (user, done) {
    done(null, user.user_id);
  });
  passport.deserializeUser(function (id, done) {
    var query = 'SELECT * FROM users WHERE user_id=?';
    client.executeAsPrepared(query, [id], cql.types.consistencies.one, function (err, user) {
      done(err, user.rows[0]);
    });
  });
  app.use(passport.initialize())
     .use(passport.session());
  return passport;
};
