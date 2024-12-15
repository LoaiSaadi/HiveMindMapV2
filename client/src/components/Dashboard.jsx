// import React, { useState, useEffect } from "react";
// import { collection, addDoc, onSnapshot } from "firebase/firestore";
// import { db } from "../firebase";
// import MapEditor from "./MapEditor";
// import { signOut } from "firebase/auth";
// import { useNavigate } from "react-router-dom"; // Import useNavigate to redirect after logout
// import { auth } from "../firebase"; // Import auth from firebase.js

// const Dashboard = ({ user }) => {
//   const [maps, setMaps] = useState([]);
//   const [selectedMapId, setSelectedMapId] = useState(null);
//   const [newMapName, setNewMapName] = useState(""); // שדה לשם המפה החדשה
//   const navigate = useNavigate(); // Initialize the navigate function

//   useEffect(() => {
//     const colRef = collection(db, "maps");
//     const unsubscribe = onSnapshot(colRef, (snapshot) => {
//       const allMaps = [];
//       snapshot.forEach((doc) => {
//         allMaps.push({ id: doc.id, ...doc.data() });
//       });
//       setMaps(allMaps);
//     });
//     return () => unsubscribe();
//   }, []);

//   const createNewMap = async (e) => {
//     e.preventDefault();
//     if (!newMapName.trim()) return;
//     const docRef = await addDoc(collection(db, "maps"), {
//       name: newMapName,
//       nodes: [],
//       edges: [],
//       userId: user.uid,
//       createdAt: new Date()
//     });
//     console.log("New map created with ID:", docRef.id);
//     setNewMapName("");
//     setSelectedMapId(docRef.id);
//   };

//     // Handle Logout
//     const handleLogout = async () => {
//       try {
//         await signOut(auth); // Log the user out
//         console.log("User logged out successfully!");
//         navigate("/"); // Redirect to login page after logout
//       } catch (error) {
//         console.error("Error logging out: ", error.message); // Handle logout error
//       }
//     };


//   if (selectedMapId) {
//     console.log("Rendering MapEditor with mapId:", selectedMapId);
//     return <MapEditor mapId={selectedMapId} />;
//   }
  

//   return (
//     <div className="dashboard-container">
//       <div className="header">
//         <h2>Welcome, {user.email}</h2>
//         {/* Log Out Button */}
//         <button className="logout-button" onClick={handleLogout}>
//           Log Out
//         </button>
//       </div>
      
//       {/* Form to create a new map with a name */}
//       <form onSubmit={createNewMap} className="new-map-form">
//         <input
//           type="text"
//           value={newMapName}
//           onChange={(e) => setNewMapName(e.target.value)}
//           placeholder="Enter map name"
//           className="new-map-input"
//         />
//         <button type="submit" className="create-map-button">Create New Map</button>
//       </form>

//       <h3>Your Maps:</h3>
//       <ul className="maps-list">
//         {maps.map((m) => (
//           <li key={m.id} className="map-item">
//             <button className="map-button" onClick={() => setSelectedMapId(m.id)}>
//               {m.name || m.id}
//             </button>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default Dashboard;

import React, { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import MapEditor from "./MapEditor";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom"; // Import useNavigate to redirect after logout
import { auth } from "../firebase"; // Import auth from firebase.js
import '../styles/Dashboard.css';



const Dashboard = ({ user }) => {
  const [maps, setMaps] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [newMapName, setNewMapName] = useState(""); // Field for new map name
  const navigate = useNavigate(); // Initialize navigate function

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
    console.log("HIIIII step 1");
    e.preventDefault();
    console.log("HIIIII step 2");
    if (!newMapName.trim()) return;
    console.log("HIIIII step 3");
    const docRef = await addDoc(collection(db, "maps"), {
      
      name: newMapName,
      nodes: [],
      edges: [],
      userId: user.uid,
      createdAt: new Date()
    });
    console.log("New map created with ID:", docRef.id);
    setNewMapName("");
    setSelectedMapId(docRef.id);
  };

  // const createNewMap = async (e) => {
  //   console.log("HIIIII step 1");
  //   e.preventDefault();
  //   console.log("HIIIII step 2");
  //   if (!newMapName.trim()) return;
  //   console.log("HIIIII step 3");
  //   const docRef = await addDoc(collection(db, "maps"), {
  //     name: newMapName,
  //     nodes: [],
  //     edges: [],
  //     userId: user.uid,
  //     createdAt: new Date(),
  //   });
  //   console.log("New map created with ID:", docRef.id);
  //   setNewMapName("");
  //   setSelectedMapId(docRef.id);
    
  //   // Navigate to MapEditor page for the new map
  //   navigate(`/map/${docRef.id}`);
  // };

  
  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // Log the user out
      console.log("User logged out successfully!");
      navigate("/"); // Redirect to login page after logout
    } catch (error) {
      console.error("Error logging out: ", error.message); // Handle logout error
    }
  };

  if (selectedMapId) {
    console.log("Rendering MapEditor with mapId:", selectedMapId);
    return <MapEditor mapId={selectedMapId} />;
  }

 
  return (
    <div className="dashboard-container">
      <div className="header">
        <h2>Welcome back, {user.email} :)</h2>
        <button className="logout-button" onClick={handleLogout}>
          Log Out
        </button>
      </div>
      
      <form onSubmit={createNewMap} className="new-map-form">
        <input
          type="text"
          value={newMapName}
          onChange={(e) => setNewMapName(e.target.value)}
          placeholder="Enter map name"
          className="new-map-input"
        />
        <button type="submit" className="create-map-button">Create New Map</button>
      </form>

      <h3>Your Maps:</h3>
      <ul className="maps-list">
        {maps.map((m) => (
          <li key={m.id} className="map-item">
            <button className="map-button" onClick={() => setSelectedMapId(m.id)}>
              {m.name || m.id}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
