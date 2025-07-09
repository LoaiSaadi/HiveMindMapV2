
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
