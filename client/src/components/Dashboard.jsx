import React, { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import MapEditor from "./MapEditor";

const Dashboard = ({ user }) => {
  const [maps, setMaps] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [newMapName, setNewMapName] = useState(""); // שדה לשם המפה החדשה

  useEffect(() => {
    const colRef = collection(db, "maps");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const allMaps = [];
      snapshot.forEach((doc) => {
        allMaps.push({ id: doc.id, ...doc.data() });
      });
      setMaps(allMaps);
    });
    return () => unsubscribe();
  }, []);

  const createNewMap = async (e) => {
    e.preventDefault();
    if (!newMapName.trim()) return;
    const docRef = await addDoc(collection(db, "maps"), {
      name: newMapName,
      nodes: [],
      edges: [],
      userId: user.uid,
      createdAt: new Date()
    });
    setNewMapName("");
    setSelectedMapId(docRef.id);
  };

  if (selectedMapId) {
    return <MapEditor mapId={selectedMapId} />;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Welcome, {user.email}</h2>
      
      {/* טופס ליצירת מפה חדשה עם שם */}
      <form onSubmit={createNewMap} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={newMapName}
          onChange={(e) => setNewMapName(e.target.value)}
          placeholder="Enter map name"
          style={{ padding: "5px", marginRight: "10px" }}
        />
        <button type="submit">Create New Map</button>
      </form>

      <h3>Your Maps:</h3>
      <ul>
        {maps.map((m) => (
          <li key={m.id}>
            <button onClick={() => setSelectedMapId(m.id)}>
              {m.name || m.id}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
