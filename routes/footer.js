module.exports = function () {
  var about = function (req, res) {
    res.render('about.jade', { user: req.user });
  };

  var contact = function (req, res) {
    res.render('contact.jade', { user: req.user });
  };

  var help = function (req, res) {
    res.render('help.jade', { user: req.user });
  };

  return { about: about,
           contact: contact,
           help: help };
};
