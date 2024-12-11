const admin = require("firebase-admin");

// החליפי את הקובץ למפתח השירות שלך שהורדת מ-Firebase Console
const serviceAccount = require("C:\Users\samia\Desktop\mindmapapp-f4b64-firebase-adminsdk-3o8g9-53c1f26591.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mindmapapp-f4b64-default-rtdb.firebaseio.com/",
});

const auth = admin.auth();
const db = admin.firestore();

module.exports = { auth, db };
