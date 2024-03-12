module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user.active) {
    req.flash("error", "You must be siged in!");
    return res.redirect("/login");
  }
  next();
};

module.exports.isAdmin = (req, res, next) => {
  if (!req.user.admin) {
    req.flash("error", "You must be an Administrator!");
    return res.redirect("/user");
  }
  next();
};

module.exports.isResearcher = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user.active || !req.user.researcher) {
    req.flash("error", "You must be siged in!");
    return res.redirect("/loginres");
  } 
  next();
};
