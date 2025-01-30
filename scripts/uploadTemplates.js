const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
//const serviceAccount = require("C:\\Users\\esraa\\OneDrive\\Desktop\\mindmapapp-f4b64-firebase-adminsdk-3o8g9-80fc413c0c.json");
const serviceAccount = require("C:\\Users\\samia\\Documents\\mindmapapp-f4b64-firebase-adminsdk-3o8g9-53c1f26591.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const templates = [
  {
    id: "blank-map",
    name: "Blank Map",
    description: "Start your brainstorming with a blank map.",
    nodes: [{ id: "node-1", label: "Main Idea", x: 300, y: 200 }],
    edges: [],
  },
  {
    id: "hierarchical-map",
    name: "Hierarchical Map",
    description: "Organize ideas hierarchically for structured brainstorming.",
    nodes: [
      { id: "1", label: "Main Topic", x: 300, y: 200 },
      { id: "2", label: "Category 1", x: 200, y: 300 },
      { id: "3", label: "Category 2", x: 300, y: 300 },
    ],
    edges: [
      { id: "reactflow__edge-1-2", source: "1", target: "2" },
      { id: "reactflow__edge-1-3", source: "1", target: "3" },
    ],
  },
];

const uploadTemplates = async () => {
  const batch = db.batch();

  templates.forEach((template) => {
    const docRef = db.collection("mapTemplates").doc(template.id);
    batch.set(docRef, template);
  });

  await batch.commit();
  console.log("Templates uploaded successfully!");
};

uploadTemplates();
