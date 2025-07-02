// const admin = require("firebase-admin");

// // החליפי את הקובץ למפתח השירות שלך שהורדת מ-Firebase Console
// // const serviceAccount = require("C:\\Users\\samia\\Documents\\mindmapapp-f4b64-firebase-adminsdk-3o8g9-53c1f26591.json");
// const serviceAccount = require("C:\\Users\\esraa\\OneDrive\\Desktop\\mindmapapp-f4b64-firebase-adminsdk-3o8g9-80fc413c0c.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://mindmapapp-f4b64-default-rtdb.firebaseio.com/",
// });
// const db = admin.firestore();
// const auth = admin.auth();
// module.exports = { auth, db };







// require('dotenv').config(); // loads .env variables
// const admin = require("firebase-admin");
// const path = require("path");

// // Safely resolve full path to the service account file
// const serviceAccountPath = path.resolve(process.env.FIREBASE_ADMIN_SDK_PATH);
// const serviceAccount = require(serviceAccountPath);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: process.env.FIREBASE_DB_URL,
// });

// const db = admin.firestore();
// const auth = admin.auth();

// module.exports = { auth, db };










// server/config/firebaseConfig.js

// Load the .env from root folder
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const admin = require('firebase-admin');
const path = require('path');

// Safely load the service account path
const serviceAccountPath = path.resolve(__dirname, '../secrets/firebase-service-account.json');
const serviceAccount = require(serviceAccountPath);
// const serviceAccount = require('../secrets/firebase-service-account.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL, // from .env
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };
