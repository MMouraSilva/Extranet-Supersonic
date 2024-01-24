const connection = require('../database/connection');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

const db = getFirestore(connection);

class Page {
    constructor(data) {
        this.id = data.id;
        this.pageName = data.pageName;
        this.urlPath = data.urlPath;
        this.isSubMenu = data.isSubMenu;
        this.isMenuGroup = data.isMenuGroup;
        this.menuGroupId = data.menuGroupId;
    }

    async CreatePage() {
        try {
            const pageExists = await this.GetPageByName();

            var pageError, hasError;

            if(pageExists) {
                pageError = true;
            } else {
                pageError = false;
            }

            if(pageError) {
                hasError = true;
            } else {
                hasError = false;
            }

            if(hasError) {
                return { hasError, pageError, error: "Página já existe" };
            } else {
                const data = {
                    pageName: this.pageName,
                    urlPath: this.urlPath,
                    isSubMenu: this.isSubMenu,
                    isMenuGroup: this.isMenuGroup,
                    menuGroupId: this.menuGroupId,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: null
                }
        
                await db.collection("pages").add(data);
        
                return { hasError: false };
            }
        } catch(error) {
            return { hasError: true, error };
        }
    }

    static async GetPages() {
        var loadedPages = {};

        const pages = await db.collection("pages").get();

        pages.forEach(async page => {
            loadedPages[page.id] = page.data();
        });

        for await (const [id, page] of Object.entries(loadedPages)) {
            if(page.menuGroupId) {
                await db.collection("pages").doc(page.menuGroupId).get().then(menuGroup => {
                    loadedPages[id].menuGroupName = menuGroup.data().pageName;
                });
            }
        }

        return loadedPages;
    }

    async GetPageByName() {
        const page = await db.collection("pages").where("pageName", "==", this.pageName).limit(1).get();

        if(page.empty) {
            return false; // User don't exist
        } else {
            return true; // User exists
        }
    }

    async GetPageById() {
        return await db.collection("pages").doc(this.id).get();
    }

    static async GetMenuGroup() {
        return await db.collection("pages").where("isMenuGroup", "==", true).get();
    }

    async UpdatePage() {
        try {
            const page = await this.GetPageById();
            const pageExists = await this.GetPageByName(this.login);
            var changeName, hasError, nameError;

            if(page.data().pageName == this.pageName) {
                changeName = false;
            } else {
                changeName = true;
            }

            if(changeName) {
                if(pageExists) {
                    nameError = true;
                } else {
                    nameError = false;
                }
            }

            if(nameError) {
                hasError = true;
            } else {
                hasError = false;
            }

            if(hasError) {
                return { hasError, pageError: nameError, error: "Página já existe" };
            } else {
                // Update user without changing the password
                const data = {
                    pageName: this.pageName,
                    urlPath: this.urlPath,
                    isSubMenu: this.isSubMenu,
                    isMenuGroup: this.isMenuGroup,
                    menuGroupId: this.menuGroupId,
                    updatedAt: FieldValue.serverTimestamp()
                }
    
                await db.collection("pages").doc(this.id).update(data);
                return { hasError: false };
            }
        } catch(error) {
            return { hasError: true, error };
        }
    }

    async DeletePage() {
        await db.collection("pages").doc(this.id).delete();
    }
}

module.exports = Page;