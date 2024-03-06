function userAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
}

function userPermission(req, res, next) {
    var re = new RegExp("(\/[a-z]+)");
    var reqRoutePath = req.route.path;
    var routePath = reqRoutePath.match(re) ? reqRoutePath.match(re) : "Home";
    
    if(req.session.user.allowedRoutes.includes(routePath[1]) || routePath == "Home") {
        next();
    } else {
        res.redirect("/");
    }
}

module.exports = [ userAuth, userPermission ];