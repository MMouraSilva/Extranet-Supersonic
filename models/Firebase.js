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
        this.FieldValue = FieldValue;
        this.#error = "";
    }

    async FirebaseAddDoc(data) {
        const dataToInsert = this.#InsertCreatedAtStamp(data);
        await this.db.collection(this.collection).add(dataToInsert)
            .then((docRef) => this.docRef = docRef)
            .catch(error => this.error = error);

        return { hasSucceed: this.error ? false : true , error: this.error, docRef: this.docRef, operation: "create" }
    }

    async FirebaseGetDocs() {
        const docs = await this.db.collection(this.collection).get()
            .catch(error => this.error = error);

        return { docs, error: this.error };
    }

    async FirebaseGetDocById(id) {
        const doc = await this.db.collection(this.collection).doc(id).get()
            .catch(error => this.error = error);

        let docData = doc.data();
        docData.id = id;

        return { doc: docData, error: this.error };
    }
    
    async FirebaseGetDocByField(value) {
        const docs = await this.db.collection(this.collection).where(this.field, "==", value).get();
        return docs;
    }
    
    async FirebaseUpdateDoc(id, data) {
        const dataToUpdate = this.#InsertUpdatedAtStamp(data);
        await this.db.collection(this.collection).doc(id).update(dataToUpdate)
            .catch(error => this.error = error);

        return { hasSucceed: this.error ? false : true , error: this.error, docRef: id, operation: "update" }
    }

    async FirebaseDeleteDocById(id) {
        let hasSucceed = false;
        await this.db.collection(this.collection).doc(id).delete()
            .then(() => hasSucceed = true)
            .catch(error => this.error = error);

        return { hasSucceed, error: this.error, operation: "delete" };
    }

    #InsertCreatedAtStamp(data) {
        data.createdAt = this.FieldValue.serverTimestamp();
        data.updatedAt = null;

        return data;
    }

    #InsertUpdatedAtStamp(data) {
        data.updatedAt = this.FieldValue.serverTimestamp();

        return data;
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