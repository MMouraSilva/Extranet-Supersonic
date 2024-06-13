const Firebase = require("./Firebase");
const ErrorHandler = require("./ErrorHandler");
const ProfilesPermissions = require("./ProfilesPermissions");

class UsersProfiles {
    constructor() {
        this.firebase = new Firebase();
        this.pageFirebase = new Firebase();
        this.errorHandler = new ErrorHandler();
        this.profilesPermissions = new ProfilesPermissions();
        this.firebase.collection = "users_profiles";
        this.pageFirebase.collection = "pages";
    }

    async SaveUserProfilesInDatabase(idProfile, idUser) {
        const profileData = { idUser, idProfile };
        const { error } = await this.firebase.FirebaseAddDoc(profileData);
        if(error) this.errorHandler.HandleError(error);
    
        return error ? true : false;
    }

    async GetUsersProfilesByUserId(idUser) {
        this.firebase.field = "idUser";
        const { docs, error } = await this.firebase.FirebaseGetDocByField(idUser);
        if(error) this.errorHandler.HandleError(error);

        return docs;
    }

    async GetUserPermissionsByUserId(idUser) {
        const docs = await this.GetUsersProfilesByUserId(idUser);
        const profiles = this.#GetIdProfilesFromUserProfiles(docs);
        const pages = await this.#GetPermissionsByIdProfile(profiles);
        const permissions = await this.#GetPages(pages);
        const filteredPermissions = this.#RemoveDuplicatedPermissions(permissions);
        
        return filteredPermissions;
    }

    #GetIdProfilesFromUserProfiles(docs) {
        let profiles = [];
        docs.forEach(doc => profiles.push(doc.data().idProfile));

        return profiles;
    }

    async #GetPermissionsByIdProfile(profiles) {
        let pages = [];
        for(let i = 0; i < profiles.length; i++) {
            const profilePermissions = await this.profilesPermissions.GetPermissionsByIdProfile(profiles[i]);

            if(profilePermissions._size) {
                const getIdPages = profilePermissions.docs.map(doc => pages.push(doc.data().idPage));
                await Promise.all(getIdPages)
                    .catch(error => this.errorHandler.HandleError(error));
            }
        }

        return pages;
    }

    async #GetPages(pages) {
        let permissions = [];
        for(let i = 0; i < pages.length; i++) {
            const { doc, error } = await this.pageFirebase.FirebaseGetDocById(pages[i]);
            if(error) this.errorHandler.HandleError(error);

            permissions.push(doc);
        }

        return permissions;
    }

    #RemoveDuplicatedPermissions(permissions) {
        const filteredPermissions = permissions.filter((permission, index, self) =>
            index === self.findIndex((p) => p.id === permission.id)
        );

        return filteredPermissions;
    }

    async DeleteUserProfiles(id) {
        const profilesQuery = await this.GetUsersProfilesByUserId(id);
        if(profilesQuery._size) {
            const profileDeletions = profilesQuery.docs.map(async (doc) => {
                await this.firebase.FirebaseDeleteDocById(doc.id);
            });
    
            await Promise.all(profileDeletions)
                .catch(error => this.errorHandler.HandleError(error));
        }
    }

    async DeleteUserProfilesById(id) {
        const { hasSucceed, error } = await this.firebase.FirebaseDeleteDocById(id);
        if(error) this.errorHandler.HandleError(error);

        return hasSucceed
    }
}

module.exports = UsersProfiles;