module.exports = function () {
  var about = function () {
    res.render('about.jade', { user: req.user });
  };

  var contact = function () {
    res.render('contact.jade', { user: req.user });
  };

  var help = function () {
    res.render('help.jade', { user: req.user });
  };

  return { about: about,
           contact: contact,
           help: help };
};
