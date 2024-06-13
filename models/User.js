const bcrypt = require("bcrypt");

const Firebase = require("./Firebase");
const ErrorHandler = require("./ErrorHandler");
const Profile = require("./Profile");
const UsersProfiles = require("./UsersProfiles");

class User {
    constructor() {
        this.dataModel = new UserDataModel();
        this.firebase = new Firebase();
        this.firebase.collection = "users";
        this.errorHandler = new ErrorHandler();
        this.profile = new Profile();
        this.usersProfiles = new UsersProfiles();
    }

    // Main Methods (used directly by Controller)
    async CreateUser() {
        const { loginExists, emailExists, loginOrEmailHasError } = await this.#CheckIfFieldValuesExists();
        const hasError = loginOrEmailHasError ? true : await this.#SaveUserInDatabase();
        const hasProfileCreationError = await this.#AssignUserProfiles();

        return { hasError, loginExists, emailExists, hasProfileCreationError, id: this.id };
    }

    async GetUsers() {
        const { docs, error } = await this.firebase.FirebaseGetDocs();
        if(error) this.errorHandler.HandleError(error);

        return docs;
    }

    async GetUserById(id) {
        const { doc, error } = await this.firebase.FirebaseGetDocById(id);
        if(error) this.errorHandler.HandleError(error);

        return doc;
    }

    async UpdateUser() {
        const { loginExists, emailExists } = await this.#CheckIfFieldValuesExists();
        const { emailError, loginError, hasError, userData } = await this.#GetUserDataToUpdate(loginExists, emailExists);
        const { hasSucceed, error } = !hasError ? await this.firebase.FirebaseUpdateDoc(this.dataModel.id, userData) : { hasSucceed: false, error: false };
        if(error) this.errorHandler.HandleError(error);
        const hasProfileUpdateError = hasSucceed ? await this.#UpdateUserProfiles() : false;

        return { hasError: !hasSucceed, loginError, emailError, hasProfileUpdateError };
    }

    async DeleteUser(id) {
        await this.usersProfiles.DeleteUserProfiles(id);
        const { hasSucceed, error } = await this.firebase.FirebaseDeleteDocById(id);
        if(error) this.errorHandler.HandleError(error);

        return hasSucceed;
    }

    async AuthenticateUserPassword(password) {
        return bcrypt.compareSync(password, this.dataModel.password);
    }

    async ValidateCredentialToAuthenticate() {
        const userDoc = await this.#GetUserByLogin(this.dataModel.login);

        return userDoc.empty ? false : this.#SetUserToAuthenticate(userDoc);
    }

    async PushIdProfileToArray(profiles) {
        var userProfiles = [];

        profiles.docs.map(doc => {
            userProfiles.push(doc.data().idProfile);
        });

        return userProfiles;
    }


    // Create Methods
    async #SaveUserInDatabase() {
        const data = await this.#GetUserDataToRegister();
        const { error, docRef } = await this.firebase.FirebaseAddDoc(data);
        if(error) this.errorHandler.HandleError(error);
        this.dataModel.id = docRef.id;

        return error ? true : false;
    }

    async #AssignUserProfiles() {
        let hasError = false;
        if(this.dataModel.profiles.length) {
            for(var i = 0; i < this.dataModel.profiles.length; i++) {
                hasError = await this.usersProfiles.SaveUserProfilesInDatabase(this.dataModel.profiles[i], this.dataModel.id) ? true : hasError;
            }
        }

        return hasError;
    }


    // Update Methods
    async #GetUserDataToUpdate(loginExists, emailExists) {
        const { changeEmail, changeLogin } = await this.#CheckIfFieldWillBeChanged(await this.GetUserById(this.dataModel.id));
        const { emailError, loginError, changePassword, hasError } = this.#CheckForErrorsOnUpdate(changeEmail, changeLogin, loginExists, emailExists);
        const userData = await this.#GetUserDataToRegister();

        if(!changePassword) delete userData.password;

        return { emailError, loginError, hasError, userData };
    }

    async #CheckIfFieldWillBeChanged(user) {
        var changeEmail = user.email == this.dataModel.email ? false : true;
        var changeLogin = user.login == this.dataModel.login ? false : true;

        return { changeEmail, changeLogin }
    }

    #CheckForErrorsOnUpdate(changeEmail, changeLogin, loginExists, emailExists) {
        const emailError = changeEmail && emailExists ? true : false;
        const loginError = changeLogin && loginExists ? true : false;
        const changePassword = this.dataModel.password ? true : false;

        return { emailError, loginError, changePassword, hasError: emailError || loginError ? true : false };
    }

    async #UpdateUserProfiles() {
        try {
            var hasProfileUpdateError = false;
            const actualProfiles = await this.usersProfiles.GetUsersProfilesByUserId(this.dataModel.id);
            await this.#CheckForProfilesToDelete(actualProfiles);
            await this.#CheckForProfilesToCreate(actualProfiles);
        } catch(error) {
            this.errorHandler.HandleError(error)
            hasProfileUpdateError = true;
        } finally {
            return hasProfileUpdateError;
        }
    }

    async #CheckForProfilesToDelete(profiles) {
        const profileDeletions = profiles.docs.map(async (doc) => {
            if(!this.dataModel.profiles.includes(doc.data().idProfile)) {
                await this.usersProfiles.DeleteUserProfilesById(doc.id);
            }
        });

        await Promise.all(profileDeletions)
            .catch(error => this.errorHandler.HandleError(error));
    }

    async #CheckForProfilesToCreate(profiles) {
        const userProfiles = await this.PushIdProfileToArray(profiles);

        const profileCreation = this.dataModel.profiles.map(async (doc) => {
            if(!userProfiles.includes(doc) && doc) {
                await this.usersProfiles.SaveUserProfilesInDatabase(doc, this.dataModel.id);
            }
        });

        await Promise.all(profileCreation)
            .catch(error => this.errorHandler.HandleError(error));
    }


    // Authenticate Methods
    #SetUserToAuthenticate(userDoc) {
        let user = this.#CreateUserObject(userDoc);
        this.dataModel.SetUser(user);

        return true;
    }

    #CreateUserObject(data) {
        let user = {};
        data.docs.find(doc => {
            user = doc.data();
            user.id = doc.id;
        });

        return user;
    }


    // Common usage Methods
    async #CheckIfFieldValuesExists() {
        const loginExists = await this.#IsLoginUnique(this.dataModel.login);
        const emailExists = await this.#GetUserByEmail(this.dataModel.email);
        const loginOrEmailHasError = loginExists || emailExists ? true : false;

        return { loginExists, emailExists, loginOrEmailHasError };
    }

    async #IsLoginUnique(login) {
        const doc = await this.#GetUserByLogin(login);
        return doc.empty ? false : true;
    }

    async #GetUserByLogin(login) {
        this.firebase.field = "login";
        const { docs, error } = await this.firebase.FirebaseGetDocByField(login);
        if(error) this.errorHandler.HandleError(error);

        return docs;
    }

    async #GetUserByEmail(email) {
        this.firebase.field = "email";
        const { doc, error } = await this.firebase.FirebaseGetUniqueDocByField(email);
        if(error) this.errorHandler.HandleError(error);

        return doc.empty ? false : true;
    }

    async #GetUserDataToRegister() {
        return {
            name: this.dataModel.name,
            email: this.dataModel.email,
            login: this.dataModel.login,
            password: await this.#GeneratePasswordHash(),
            phone: this.dataModel.phone,
        };
    }

    async #GeneratePasswordHash() {
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(this.dataModel.password, salt);
    }
}

class UserDataModel {
    #id;
    #name;
    #email;
    #login;
    #password;
    #phone;
    #profiles = [];

    GetUser() {
        const data = {
            id: this.id,
            name: this.name,
            email: this.email,
            login: this.login,
            password: this.password,
            phone: this.phone,
            profiles: this.profiles
        }

        return data;
    }
    
    SetUser(data) {
        this.id = data ? data.id : null;
        this.name = data.name;
        this.email = data.email;
        this.login = data.login;
        this.password = data.password;
        this.phone = data.phone;
        if(data.profiles) this.profiles = data.profiles;
    }

    get id() {
        return this.#id;
    };
    set id(newValue) {
        this.#id = newValue;
    };

    get name() {
        return this.#name;
    };
    set name(newValue) {
        this.#name = newValue;
    };

    get email() {
        return this.#email;
    };
    set email(newValue) {
        this.#email = newValue;
    };

    get login() {
        return this.#login;
    };
    set login(newValue) {
        this.#login = newValue;
    };

    get password() {
        return this.#password;
    };
    set password(newValue) {
        this.#password = newValue;
    };

    get phone() {
        return this.#phone;
    };
    set phone(newValue) {
        this.#phone = newValue;
    };

    get profiles() {
        return this.#profiles;
    };
    set profiles(newValue) {
        this.#profiles = [].concat(newValue);
    };
}


module.exports = User;