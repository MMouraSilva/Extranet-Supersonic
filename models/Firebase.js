const connection = require('../database/connection');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

class Firebase {
    #collection;
    #field;
    #docRef;
    #error;

    constructor() {
        this.db = getFirestore(connection);
        this.Filter = Filter;
        this.#error = "";
    }

    async FirebaseAddDoc(data) {
        await this.db.collection(this.collection).add(data)
        .then((docRef) => this.docRef = docRef)
        .catch(error => this.error = error);

        return { hasSucceed: this.error ? false : true , error: this.error, docRef: this.docRef }
    }

    async FirebaseGetDocs() {
        const docs = await this.db.collection(this.collection).get()
        .catch(error => this.error = error);
        
        return { docs, error: this.error };
    }
    
    async FirebaseGetDocByField(value) {
        const docs = await this.db.collection(this.collection).where(this.field, "==", value).get();
        return docs;
    }

    get collection() {
        return this.#collection;
    }
    set collection(collectionName) {
        this.#collection = collectionName;
    }

    get field() {
        return this.#field;
    }
    set field(fieldName) {
        this.#field = fieldName;
    }

    get docRef() {
        return this.#docRef;
    }
    set docRef(id) {
        this.#docRef = id;
    }

    get error() {
        return this.#error;
    }
    set error(errorMessage) {
        this.#error = errorMessage;
    }
}


module.exports = Firebase;