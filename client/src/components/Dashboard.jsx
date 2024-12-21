

// import React, { useState, useEffect } from "react";
// import { collection, addDoc, onSnapshot } from "firebase/firestore";
// import { db } from "../firebase";
// import MapEditor from "./MapEditor";
// import { signOut } from "firebase/auth";
// import { useNavigate } from "react-router-dom"; // Import useNavigate to redirect after logout
// import { auth } from "../firebase"; // Import auth from firebase.js
// import '../styles/Dashboard.css';



// const Dashboard = ({ user }) => {
//   const [maps, setMaps] = useState([]);
//   const [selectedMapId, setSelectedMapId] = useState(null);
//   const [newMapName, setNewMapName] = useState(""); // Field for new map name
//   const navigate = useNavigate(); // Initialize navigate function

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
//     console.log("HIIIII step 1");
//     e.preventDefault();
//     console.log("HIIIII step 2");
//     if (!newMapName.trim()) return;
//     console.log("HIIIII step 3");
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

//   // const createNewMap = async (e) => {
//   //   console.log("HIIIII step 1");
//   //   e.preventDefault();
//   //   console.log("HIIIII step 2");
//   //   if (!newMapName.trim()) return;
//   //   console.log("HIIIII step 3");
//   //   const docRef = await addDoc(collection(db, "maps"), {
//   //     name: newMapName,
//   //     nodes: [],
//   //     edges: [],
//   //     userId: user.uid,
//   //     createdAt: new Date(),
//   //   });
//   //   console.log("New map created with ID:", docRef.id);
//   //   setNewMapName("");
//   //   setSelectedMapId(docRef.id);
    
//   //   // Navigate to MapEditor page for the new map
//   //   navigate(`/map/${docRef.id}`);
//   // };

  
//   // Handle Logout
//   const handleLogout = async () => {
//     try {
//       await signOut(auth); // Log the user out
//       console.log("User logged out successfully!");
//       navigate("/"); // Redirect to login page after logout
//     } catch (error) {
//       console.error("Error logging out: ", error.message); // Handle logout error
//     }
//   };

//   if (selectedMapId) {
//     console.log("Rendering MapEditor with mapId:", selectedMapId);
//     return <MapEditor mapId={selectedMapId} />;
//   }

 
//   return (
//     <div className="dashboard-container">
//       <div className="header">
//         <h2>Welcome back, {user.email} :)</h2>
//         <button className="logout-button" onClick={handleLogout}>
//           Log Out
//         </button>
//       </div>
      
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
import { collection, addDoc, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import MapEditor from "./MapEditor";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import io from 'socket.io-client';
import '../styles/Dashboard.css';

const Dashboard = ({ user }) => {
  const [maps, setMaps] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [newMapName, setNewMapName] = useState("");
  const [joinMapName, setJoinMapName] = useState("");
  const [isCreateInputVisible, setIsCreateInputVisible] = useState(false);
  const [isJoinInputVisible, setIsJoinInputVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isVisible: false, mapId: null, mapName: "" });
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

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

  useEffect(() => {
    console.log("Dashboard rendered!");
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    newSocket.on('newMapCreated', (newMap) => {
      setMaps((prevMaps) => [...prevMaps, newMap]);
      console.log('New map created:', newMap);
    });
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createNewMap = async (e) => {
    e.preventDefault();
    if (!newMapName.trim()) return;
    try {
      const docRef = await addDoc(collection(db, "maps"), {
        name: newMapName,
        nodes: [],
        edges: [],
        userId: user.uid,
        createdAt: new Date(),
      });
      console.log("New map created with ID:", docRef.id);
      setNewMapName("");
      setSelectedMapId(docRef.id);
      if (socket) {
        socket.emit('mapCreated', { id: docRef.id, name: newMapName });
      }
      setIsCreateInputVisible(false);
    } catch (err) {
      console.error("Error creating map:", err.message);
    }
  };

  const handleDeleteClick = (mapId, mapName) => {
    setConfirmDelete({ isVisible: true, mapId, mapName });
  };

  const confirmDeleteMap = async () => {
    const { mapId } = confirmDelete;
    try {
      await deleteDoc(doc(db, "maps", mapId));
      setMaps((prevMaps) => prevMaps.filter((map) => map.id !== mapId));
      console.log(`Map with ID: ${mapId} deleted.`);
      setConfirmDelete({ isVisible: false, mapId: null, mapName: "" });
    } catch (err) {
      console.error("Error deleting map:", err.message);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete({ isVisible: false, mapId: null, mapName: "" });
  };

  const joinMap = async (e) => {
    e.preventDefault();
    if (!joinMapName.trim()) return;
    try {
      const mapToJoin = maps.find(map => map.name === joinMapName);
      if (mapToJoin) {
        setSelectedMapId(mapToJoin.id);
        console.log("Joined map:", mapToJoin.name);
      } else {
        console.log("Map not found!");
      }
      setJoinMapName("");
      setIsJoinInputVisible(false);
    } catch (err) {
      console.error("Error joining map:", err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error logging out: ", error.message);
    }
  };

  if (selectedMapId) {
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

      <div className="button-container">
        {/* Create New Map Button */}
        {!isCreateInputVisible && (
          <button className="card-button" onClick={() => setIsCreateInputVisible(true)}>
            Create New Map
          </button>
        )}

        {/* Join Map Button */}
        {!isJoinInputVisible && (
          <button className="card-button" onClick={() => setIsJoinInputVisible(true)}>
            Join Map
          </button>
        )}
      </div>

      {/* Modal for creating new map */}
      {isCreateInputVisible && (
        <div className="modal">
          <div className="modal-content">
            <form onSubmit={createNewMap} className="new-map-form">
              <input
                type="text"
                value={newMapName}
                onChange={(e) => setNewMapName(e.target.value)}
                placeholder="Enter map name"
                className="new-map-input"
              />
              <div className="modal-buttons">
                <button type="submit" className="card-button">
                  Create Map
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateInputVisible(false)}
                  className="card-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for joining a map */}
      {isJoinInputVisible && (
        <div className="modal">
          <div className="modal-content">
            <form onSubmit={joinMap} className="new-map-form">
              <input
                type="text"
                value={joinMapName}
                onChange={(e) => setJoinMapName(e.target.value)}
                placeholder="Enter map name to join"
                className="new-map-input"
              />
              <div className="modal-buttons">
                <button type="submit" className="card-button">
                  Join Map
                </button>
                <button
                  type="button"
                  onClick={() => setIsJoinInputVisible(false)}
                  className="card-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDelete.isVisible && (
        <div className="modal">
          <div className="modal-content">
            <p>Are you sure you want to delete the "{confirmDelete.mapName}" map?</p>
            <div className="modal-buttons">
              <button className="card-button" onClick={confirmDeleteMap}>Yes</button>
              <button className="card-button" onClick={cancelDelete}>No</button>
            </div>
          </div>
        </div>
      )}

      <h3>Your Maps:</h3>
      <ul className="maps-list">
        {maps.map((m) => (
          <li key={m.id} className="map-item-container">
            <button className="map-button" onClick={() => setSelectedMapId(m.id)}>
              {m.name || m.id}
            </button>
            <button className="delete-button" onClick={() => handleDeleteClick(m.id, m.name)}>
              <div className="trash-icon">
                <div className="lid"></div>
                <div className="bin">
                  <div className="face"></div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>


    </div>
  );
};

export default Dashboard;
