const Firebase = require("../models/Firebase");
const UsersProfiles = require("../models/UsersProfiles");

class Middleware {
    #firebase;
    #usersProfiles;
    #profilePermissions;
    #userPermissions;

    constructor() {
        this.#firebase = new Firebase();
        this.#usersProfiles = new UsersProfiles();
        this.#userPermissions = [];
    }

    UserAuth = async (req, res, next) => {
        if (req.session.user) {
            await this.#UserPermission(req, res, next);
        } else {
            res.redirect("/login");
        }
    }
    
    async #UserPermission(req, res, next) {
        const routePath = this.#GetRoutePath(req);

        await this.#SetUserPermissions(req.session.user.id);

        if(this.userPermissions.includes(routePath) || routePath == "/") {
            const userPermissions = await this.#usersProfiles.GetUserPermissionsByUserId(req.session.user.id);
            let user = req.session.user;
            user.permissions = userPermissions;
            next();
        } else {
            res.redirect("/");
        }
    }

    #GetRoutePath(req) {
        const reqRoutePath = req.route.path.split("/");
        return "/" + reqRoutePath[1];
    }

    async #SetUserPermissions(idUser) {
        this.#SetCollectionFieldToGet("users_profiles", "idUser");
        const userProfiles = await this.#firebase.FirebaseGetDocByField(idUser);
        if(!this.userPermissions.length) await this.#GetUserPermissionsFromFirebase(userProfiles.docs);
    }

    async #GetUserPermissionsFromFirebase(userProfiles) {
        await this.#GetUserProfiles(userProfiles);
        await this.#GetPagesUrl();
    }

    async #GetUserProfiles(userProfiles) {
        const mapProfiles = userProfiles.docs.map(async doc => {
            this.#SetCollectionFieldToGet("profiles_permissions", "idProfile");
            const profilePermissions = await this.#firebase.FirebaseGetDocByField(doc.data().idProfile);
            this.profilePermissions = profilePermissions.docs;
        });

        await Promise.all(mapProfiles);
    }

    async #GetPagesUrl() {
        const mapPermissions = this.profilePermissions.docs.map(async doc => {
            this.#SetCollectionFieldToGet("pages");
            const page = await this.#firebase.FirebaseGetDocById(doc.data().idPage);
    
            if(page.doc.urlPath) this.userPermissions = page.doc.urlPath;
        });

        await Promise.all(mapPermissions);
    }

    #SetCollectionFieldToGet(collection, field) {
        this.#firebase.collection = collection;
        this.#firebase.field = field;
    }

    get profilePermissions() {
        return this.#profilePermissions;
    };
    set profilePermissions(newValue) {
        this.#profilePermissions = newValue;
    };

    get userPermissions() {
        return this.#userPermissions;
    };
    set userPermissions(newValue) {
        this.#userPermissions.push(newValue);
    };
}

module.exports = Middleware;