const Firebase = require("./Firebase");
const ErrorHandler = require("./ErrorHandler");

class ProfilesPermissions {
    constructor() {
        this.firebase = new Firebase();
        this.errorHandler = new ErrorHandler();
        this.firebase.collection = "profiles_permissions";
    }

    async GetPermissionsByIdProfile(idProfile) {
        this.firebase.field = "idProfile";
        const { docs, error } = await this.firebase.FirebaseGetDocByField(idProfile);
        if(error) this.errorHandler.HandleError(error);

        return docs;
    }
}

module.exports = ProfilesPermissions;