const admin = require("firebase-admin");
const serviceAccount = require("/etc/secrets/admin.json");

const connection = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = connection;