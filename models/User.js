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
    }

    async CreateUser() {
        try {
            const loginExists = await this.GetUserByLogin(this.login); // Falso atualiza, Verdadeiro da erro
            const emailExists = await this.GetUserByEmail(this.email); // Falso atualiza, Verdadeiro da erro
            var emailError, loginError, hasError;

            if(emailExists) {
                hasError = true;
                emailError = true;
            } else {
                hasError = false;
                emailError = false;
            }

            if(loginExists) {
                hasError = true;
                loginError = true;
            } else {
                hasError = false;
                loginError = false;
            }

            if(hasError) {
                return { hasError, loginError, emailError, error: "Login ou e-mail já existe" };
            } else {
                const data = {
                    name: this.name,
                    email: this.email,
                    login: this.login,
                    password: this.password,
                    phone: this.phone,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                }
        
                await db.collection("users").add(data);
        
                return { hasError: false };
            }
        } catch(error) {
            return { hasError: true, error };
        }
    }

    async GetUserByLogin(login) {
        if(login) {
            const userDocs = await db.collection("users").where('login', '==', login).limit(1).get();
    
            if(userDocs.empty) {
                return false; // User don't exist
            } else {
                return true; // User exists
            }
        } else {
            const userDocs = await db.collection("users").where('login', '==', this.login).limit(1).get();
    
            if(userDocs.empty) {
                return false; // User don't exist
            } else {
                userDocs.forEach(doc => {
                    this.id = doc.id;
                    this.name = doc.data().name;
                    this.email = doc.data().email;
                    this.password = doc.data().password;
                    this.phone = doc.data().phone;
                });
                return true; // User exists
            }
        }
    }

    async GetUserByEmail(email) {
        const userDocs = await db.collection("users").where('email', '==', email).limit(1).get();

        if(userDocs.empty) {
            return false; // User don't exist
        } else {
            return true; // User exists
        }
    }

    static async GetUsers() {
        return await db.collection("users").get();
    }

    async GetUserById(id) {
        return await db.collection("users").get(id);
    }

    async UpdateUser() {
        try {
            const user = await this.GetUserById(this.id);
            const loginExists = await this.GetUserByLogin(this.login); // Falso atualiza, Verdadeiro da erro
            const emailExists = await this.GetUserByEmail(this.email); // Falso atualiza, Verdadeiro da erro
            var changeEmail, changeLogin, hasError, emailError, loginError;

            user.forEach(user => {
                if(user.data().email == this.email) {
                    changeEmail = false;
                } else {
                    changeEmail = true;
                }

                if(user.data().login == this.login) {
                    changeLogin = false;
                } else {
                    changeLogin = true;
                }
            });

            if(changeEmail) {
                if(emailExists) {
                    hasError = true;
                    emailError = true;
                } else {
                    hasError = false;
                    emailError = false;
                }
            }

            if(changeLogin) {
                if(loginExists) {
                    hasError = true;
                    loginError = true;
                } else {
                    hasError = false;
                    loginError = false;
                }
            }


            if(hasError) {
                return { hasError, loginError, emailError, error: "Login ou e-mail já existe" };
            } else {
                if(this.password) {
                    // Update user changing the password
                    const salt = bcrypt.genSaltSync(10);
                    const hash = bcrypt.hashSync(this.password, salt);
        
                    const data = {
                        name: this.name,
                        email: this.email,
                        login: this.login,
                        password: hash,
                        phone: this.phone,
                        updatedAt: FieldValue.serverTimestamp()
                    }
        
                    await db.collection("users").doc(this.id).update(data);
                    return { hasError: false };
                } else {
                    // Update user without changing the password
                     const data = {
                        name: this.name,
                        email: this.email,
                        login: this.login,
                        phone: this.phone,
                        updatedAt: FieldValue.serverTimestamp()
                    }
        
                    await db.collection("users").doc(this.id).update(data);
                    return { hasError: false };
                }
            }
        } catch(error) {
            return { hasError: true, error };
        }
    }

    async DeleteUser() {
        await db.collection("users").doc(this.id).delete();
    }

    async AuthenticateUser(password) {
        return bcrypt.compareSync(password, this.password);
    }
}

module.exports = User;