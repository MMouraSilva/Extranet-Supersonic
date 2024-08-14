const Firebase = require("../models/Firebase");
const UsersProfiles = require("../models/UsersProfiles");

class Middleware {
    #firebase;
    #usersProfiles;
    #client;
    #profilePermissions;
    #userPermissions;

    constructor() {
        this.#firebase = new Firebase();
        this.#usersProfiles = new UsersProfiles();
        this.#client = require("../config/redisClient");
        this.#userPermissions = [];
    }

    UserAuth = async (req, res, next) => {
        if (req.session.user) {
            await this.#UserPermission(req, res, next);
        } else {
            res.redirect("/login");
        }
    }

    LoginPageAuth(req, res, next) {
        if (req.session.user) res.redirect("/");
        else next();
    }

    UserUpdate = async (req, res, next) => {
        await this.#client.del(req.body.id);
        await this.UserAuth(req, res, next);
    }

    Logout = async (req, res, next) => {
        await this.#client.del(req.session.user.id);
        next();
    }
    
    async #UserPermission(req, res, next) {
        const routePath = this.#GetRoutePath(req);
        const idUser = req.session.user.id;

        const cachedPermissons = await JSON.parse(await this.#client.get(idUser));

        if(cachedPermissons) this.userPermissions = cachedPermissons;
        else await this.#SetUserPermissions(req);

        const cachedUserPermissons = await JSON.parse(await this.#client.get("permissions: " + idUser));

        if(this.userPermissions.includes(routePath) || routePath == "/") {
            const userPermissions = cachedUserPermissons ? cachedUserPermissons : await this.#GetPermissionsByUserId(idUser);
            
            const session = JSON.stringify(req.session);
            req.locals = JSON.parse(session);
            req.locals.user.permissions = userPermissions;
            next();
        } else {
            res.redirect("/");
        }
    }

    async #GetPermissionsByUserId(id) {
        const userPermissions = await this.#usersProfiles.GetUserPermissionsByUserId(id);
        await this.#client.setEx("permissions: " + id, 600, JSON.stringify(userPermissions));

        return userPermissions;
    }

    #GetRoutePath(req) {
        const reqRoutePath = req.route.path.split("/");
        return "/" + reqRoutePath[1];
    }

    async #SetUserPermissions(req) {
        const idUser = req.session.user.id;
        this.#SetCollectionFieldToGet("users_profiles", "idUser");
        const userProfiles = await this.#firebase.FirebaseGetDocByField(idUser);
        if(!this.userPermissions.length) await this.#GetUserPermissionsFromFirebase(userProfiles.docs);

        await this.#client.setEx(idUser, 600, JSON.stringify(this.userPermissions));
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
        let permissions = [];
        const mapPermissions = this.profilePermissions.docs.map(async doc => {
            this.#SetCollectionFieldToGet("pages");
            const page = await this.#firebase.FirebaseGetDocById(doc.data().idPage);
    
            if(page.doc.urlPath) permissions.push(page.doc.urlPath);
        });

        await Promise.all(mapPermissions);

        this.userPermissions = permissions;
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
        this.#userPermissions = newValue;
    };
}

module.exports = Middleware;