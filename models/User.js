const connection = require('../database/connection');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const bcrypt = require("bcrypt");

const db = getFirestore(connection);

class User {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.email = data.email;
        this.login = data.login;
        this.password = data.password;
        this.phone = data.phone;
        this.profiles = [].concat(data.profiles);
    }

    async CreateUser() {
        const { loginExists, emailExists, loginOrEmailHasError } = await this.CheckIfFieldValuesExists();
        const { hasError, hasProfileCreationError } = loginOrEmailHasError ? { hasError: true, hasProfileCreationError: true } : await this.SaveUserInDatabase();

        return { hasError, loginExists, emailExists, hasProfileCreationError, id: this.id };
    }

    async CheckIfFieldValuesExists() {
        const loginExists = await this.GetUserByLogin(this.login);
        const emailExists = await this.GetUserByEmail(this.email);
        const loginOrEmailHasError = loginExists || emailExists ? true : false;

        return { loginExists, emailExists, loginOrEmailHasError };
    }

    async SaveUserInDatabase() {
        let hasError, hasProfileCreationError;

        const data = await this.GetUserDataToRegister();

        await db.collection("users").add(data)
        .then(async (docRef) => {
            this.id = docRef.id;
            hasError = false;

            await this.AssignUserProfiles()
            .then(() => {
                hasProfileCreationError = false;
            })
            .catch(error => {
                hasProfileCreationError = true;
                console.error(error);
            });
        })
        .catch(error => {
            hasError = true;
            console.error(error);
        });

        return { hasError, hasProfileCreationError };
    }

    async GetUserDataToRegister() {
        const hash = await this.GeneratePasswordHash();

        return {
            name: this.name,
            email: this.email,
            login: this.login,
            password: hash,
            phone: this.phone,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: null
        };
    }

    async AssignUserProfiles() {
        if(this.profiles) {
            for(var i = 0; i < this.profiles.length; i++) {
                await this.SaveUserProfilesInDatabase(this.profiles[i]);
            }
        }
    }

    async SaveUserProfilesInDatabase(idProfile) {
        const profileData = {
            idUser: this.id,
            idProfile,
            createdAt: FieldValue.serverTimestamp()
        }

        await db.collection("users_profiles").add(profileData);
    }

    async GetUserByLogin(login) {
        if(login) {
            const userDocs = await db.collection("users").where('login', '==', login).limit(1).get();
    
            if(userDocs.empty) {
                return false;
            } else {
                return true;
            }
        } else {
            const userDocs = await db.collection("users").where('login', '==', this.login).limit(1).get();
    
            if(userDocs.empty) {
                return false;
            } else {
                userDocs.forEach(doc => {
                    this.id = doc.id;
                    this.name = doc.data().name;
                    this.email = doc.data().email;
                    this.password = doc.data().password;
                    this.phone = doc.data().phone;
                });
                return true;
            }
        }
    }

    async GetUserByEmail(email) {
        const user = await db.collection("users").where('email', '==', email).limit(1).get();

        if(user.empty) {
            return false;
        } else {
            return true;
        }
    }

    static async GetUsers() {
        return await db.collection("users").get();
    }

    async GetUserById() {
        return await db.collection("users").doc(this.id).get();
    }

    static async GetProfiles() {
        return await db.collection("profiles").orderBy("profileName").get();
    }

    async UpdateUser() {
        try {
            var hasError = false;
            const user = await this.GetUserById();
            const { loginExists, emailExists } = await this.CheckIfFieldValuesExists();
            const { changeEmail, changeLogin } = await this.CheckIfFieldWillBeChanged(user.data());
            var emailError = changeEmail && emailExists ? true : false;
            var loginError = changeLogin && loginExists ? true : false;
            const changePassword = this.password ? true : false;
            hasError = emailError || loginError ? true : false;
    
    
            if(!hasError) {
                if(changePassword) {
                    const hash = await this.GeneratePasswordHash();
        
                    const data = {
                        name: this.name,
                        email: this.email,
                        login: this.login,
                        password: hash,
                        phone: this.phone,
                        updatedAt: FieldValue.serverTimestamp()
                    }
        
                    await db.collection("users").doc(this.id).update(data);
                } else {
                        const data = {
                        name: this.name,
                        email: this.email,
                        login: this.login,
                        phone: this.phone,
                        updatedAt: FieldValue.serverTimestamp()
                    }
        
                    await db.collection("users").doc(this.id).update(data);
                }

                var hasProfileUpdateError = await this.UpdateUserProfiles();
            }
        } catch(error) {
            console.error(error);
            hasError = true;
        } finally {
            return { hasError, loginError, emailError, hasProfileUpdateError };
        }
    }

    async UpdateUserProfiles() {
        try {
            var hasProfileUpdateError = false;
            const actualProfiles = await this.GetUsersProfilesByUserId();
            await this.CheckForProfilesToDelete(actualProfiles);
            await this.CheckForProfilesToCreate(actualProfiles);
        } catch(error) {
            console.error(error);
            hasProfileUpdateError = true;
        } finally {
            return hasProfileUpdateError;
        }
    }

    async CheckForProfilesToDelete(profiles) {
        const profileDeletions = profiles.docs.map(async (doc) => {
            if(!this.profiles.includes(doc.data().idProfile)) {
                await doc.ref.delete();
            }
        });

        await Promise.all(profileDeletions);
    }

    async CheckForProfilesToCreate(profiles) {
        const userProfiles = await this.PushIdProfileToArray(profiles);

        const profileCreation = this.profiles.map(async (doc) => {
            if(!userProfiles.includes(doc) && doc) {
                await this.SaveUserProfilesInDatabase(doc);
            }
        });

        await Promise.all(profileCreation);
    }

    async PushIdProfileToArray(profiles) {
        var userProfiles = [];

        profiles.docs.map(doc => {
            userProfiles.push(doc.data().idProfile);
        });

        return userProfiles;
    }

    async CheckIfFieldWillBeChanged(user) {
        var changeEmail = user.email == this.email ? false : true;
        var changeLogin = user.login == this.login ? false : true;

        return { changeEmail, changeLogin }
    }

    async GeneratePasswordHash() {
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(this.password, salt);
    }

    async DeleteUser() {
        try {
            var success = false;

            await this.DeleteUserProfiles();
            await db.collection("users").doc(this.id).delete();

            success = true;
        } catch(error) {
            console.error("Error deleting user and user profiles: ", error)
        } finally {
            return success;
        }
    }

    async DeleteUserProfiles() {
        const profilesQuery = await this.GetUsersProfilesByUserId();
    
        const profileDeletions = profilesQuery.docs.map(async (doc) => {
            await doc.ref.delete();
        });

        await Promise.all(profileDeletions);
    }

    async GetUsersProfilesByUserId() {
        return await db.collection("users_profiles").where("idUser", "==", this.id).get();
    }

    async AuthenticateUser(password) {
        return bcrypt.compareSync(password, this.password);
    }
}

module.exports = User;