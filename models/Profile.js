const connection = require('../database/connection');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter, QuerySnapshot } = require('firebase-admin/firestore');

const db = getFirestore(connection);

class Profile {
    constructor(data) {
        this.id = data.id;
        this.profileName = data.profileName;
        this.permissions = data.permissions;
    }

    async CreateProfile() {
        try {
            const profileExists = await this.GetProfileByName();

            var profileError, hasError;

            if(profileExists) {
                profileError = true;
            } else {
                profileError = false;
            }

            if(profileExists) {
                hasError = true;
            } else {
                hasError = false;
            }

            if(hasError) {
                return { hasError, profileError, error: "Perfil já existe" };
            } else {
                const data = {
                    profileName: this.profileName,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: null
                }
        
                const res = await db.collection("profiles").add(data);

                if(this.permissions) {
                    if(typeof this.permissions == "string") {
                        const dataPermission = {
                            idProfile: res.id,
                            idPage: this.permissions,
                            createdAt: FieldValue.serverTimestamp()
                        }

                        await db.collection("profiles_permissions").add(dataPermission);
                    } else {
                        this.permissions.forEach(async permission => {
                            var dataPermission = {
                                idProfile: res.id,
                                idPage: permission,
                                createdAt: FieldValue.serverTimestamp()
                            }
    
                            await db.collection("profiles_permissions").add(dataPermission);
                        });
                    }
                }
        
                return { hasError: false };
            }
        } catch(error) {
            return { hasError: true, error };
        }
    }

    static async GetProfiles() {
        return await db.collection("profiles").get();
    }

    async GetProfileByName() {
        const profile = await db.collection("profiles").where("profileName", "==", this.profileName).limit(1).get();

        if(profile.empty) {
            return false;
        } else {
            return true;
        }
    }

    async GetProfileById() {
        return await db.collection("profiles").doc(this.id).get();
    }

    static async GetPages() {
        return await db.collection("pages").orderBy("pageName").get();
    }

    async GetPermissions() {
        return await db.collection("profiles_permissions").where("idProfile", "==", this.id).get();
    }

    async UpdateProfile() {
        try {
            const profile = await this.GetProfileById();
            const profileExists = await this.GetProfileByName();
            var changeName, hasError, profileError;

            if(profile.data().profileName == this.profileName) {
                changeName = false;
            } else {
                changeName = true;
            }

            if(changeName) {
                if(profileExists) {
                    profileError = true;
                } else {
                    profileError = false;
                }
            }

            if(profileError) {
                hasError = true;
            } else {
                hasError = false;
            }

            if(hasError) {
                return { hasError, profileError: profileError, error: "Perfil já existe" };
            } else {
                const data = {
                    profileName: this.profileName,
                    updatedAt: FieldValue.serverTimestamp()
                }
    
                await db.collection("profiles").doc(this.id).update(data);

                const permissions = await this.GetPermissions();

                if(!this.permissions && permissions._size == 0) {
                    console.log("Nada mudou");
                } else {
                    if(typeof this.permissions == "string") {
                        var hasNewPermission = 0;

                        if(permissions._size == 0) {
                            const dataPermission = {
                                idProfile: this.id,
                                idPage: this.permissions,
                                createdAt: FieldValue.serverTimestamp()
                            }
    
                            await db.collection("profiles_permissions").add(dataPermission);
                        } else {
                            permissions.forEach(async permission => {
                                if(permission.data().idPage != this.permissions) {
                                    await db.collection("profiles_permissions").doc(permission.id).delete();
                                } else {
                                    hasNewPermission++;
                                }
                            });
    
                            if(hasNewPermission > 0) {
                                const dataPermission = {
                                    idProfile: this.id,
                                    idPage: this.permissions,
                                    createdAt: FieldValue.serverTimestamp()
                                }
        
                                await db.collection("profiles_permissions").add(dataPermission);
                            }
                        }
                    } else {
                        if(this.permissions) {
                            if(permissions._size == 0) {
                                this.permissions.forEach(async permission => {
                                    var dataPermission = {
                                        idProfile: this.id,
                                        idPage: permission,
                                        createdAt: FieldValue.serverTimestamp()
                                    }
            
                                    await db.collection("profiles_permissions").add(dataPermission);
                                });
                            } else {
                                permissions.forEach(async permission => {
                                    var permissionExists = false;

                                    this.permissions.forEach(newPermission => {
                                        if(permission.data().idPage == newPermission) {
                                            permissionExists = true;
                                        }
                                    });

                                    if(!permissionExists) {
                                        await db.collection("profiles_permissions").doc(permission.id).delete();
                                    }
                                });

                                this.permissions.forEach(async newPermission => {
                                    var registerPermission = false;

                                    permissions.forEach(permission => {
                                        if(permission.data().idPage == newPermission) {
                                            registerPermission = true;
                                        }
                                    });

                                    if(!registerPermission) {
                                        var dataPermission = {
                                            idProfile: this.id,
                                            idPage: newPermission,
                                            createdAt: FieldValue.serverTimestamp()
                                        }

                                        await db.collection("profiles_permissions").add(dataPermission);
                                    }
                                });
                            }
                        } else {
                            permissions.forEach(async permission => {
                                await db.collection("profiles_permissions").doc(permission.id).delete();
                            });
                        }
                    }
                }
                return { hasError: false };
            }
        } catch(error) {
            return { hasError: true, error };
        }
    }

    async GetPermissionsIdById() {
        return await this.PushIdPageToArray(await this.GetPermissions());
    }

    async PushIdPageToArray(profilesPermissionsQuery) {
        var profilesPermissions = [];

        profilesPermissionsQuery.docs.map(doc => {
            profilesPermissions.push(doc.data().idPage);
        });

        return profilesPermissions;
    }

    async DeleteProfile() {
        try {
            var success = false;

            await this.DeleteProfilesPermissions();
            await db.collection("profiles").doc(this.id).delete();

            success = true;
        } catch(error) {
            console.error("Error deleting Profile and profile permissions: ", error)
        } finally {
            return success;
        }
    }

    async DeleteProfilesPermissions() {
        const permissionsQuery = await this.GetProfilesPermissionsByProfileId();
    
        const permissionsDeletions = permissionsQuery.docs.map(async (doc) => {
            await doc.ref.delete();
        });

        await Promise.all(permissionsDeletions);
    }
    
    async GetProfilesPermissionsByProfileId() {
        return await db.collection("profiles_permissions").where("idProfile", "==", this.id).get();
    }
}

module.exports = Profile;