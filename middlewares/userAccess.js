function userAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
}

function userPermission(req, res, next) {
    var reqRoutePath = req.route.path.split("/");
    var routePath = "/" + reqRoutePath[1];
    
    if(req.session.user.allowedRoutes.includes(routePath) || routePath == "/") {
        next();
    } else {
        res.redirect("/");
    }
}

module.exports = [ userAuth, userPermission ];