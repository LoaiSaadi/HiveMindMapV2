const admin = require("firebase-admin");

// החליפי את הקובץ למפתח השירות שלך שהורדת מ-Firebase Console
//const serviceAccount = require("C:\\Users\\samia\\Documents\\MindMapProject\\server\\config\\mindmapapp-f4b64-firebase-adminsdk-3o8g9-53c1f26591.json");

//require("C:\\Users\\esraa\\OneDrive\\Desktop\\mindmapapp-f4b64-firebase-adminsdk-3o8g9-80fc413c0c.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mindmapapp-f4b64-default-rtdb.firebaseio.com/",
});
const db = admin.firestore();
const auth = admin.auth();
module.exports = { auth, db };
