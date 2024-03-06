const admin = require("firebase-admin");
const serviceAccount = require("./admin.json");

const connection = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = connection;