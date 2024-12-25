import React, { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, doc, deleteDoc, query, where, getDocs, updateDoc, setDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import MapEditor from "./MapEditor";
import { signOut, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import io from "socket.io-client";
import "../styles/Dashboard.css";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

const Dashboard = ({ user }) => {
  const [maps, setMaps] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [newMapName, setNewMapName] = useState("");
  const [joinMapName, setJoinMapName] = useState("");
  const [joinMapId, setJoinMapId] = useState("");
  const [isCreateInputVisible, setIsCreateInputVisible] = useState(false);
  const [isJoinInputVisible, setIsJoinInputVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isVisible: false, mapId: null, mapName: "" });

  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [username, setUsername] = useState(user.displayName || "");
  const [profilePicture, setProfilePicture] = useState(user.photoURL || "");
  const [email, setEmail] = useState(user.email || "");
  const [error, setError] = useState("");
  const [joinSuccessMessage, setJoinSuccessMessage] = useState("");

  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const colRef = collection(db, "maps");
    const q = query(colRef, where("participants", "array-contains", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userMaps = [];
      snapshot.forEach((doc) => {
        userMaps.push({ id: doc.id, ...doc.data() });
      });
      setMaps(userMaps);
    });
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const checkUserInDatabase = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
        
        if (userDoc.empty) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            username: user.displayName || "",
            profilePicture: user.photoURL || "",
            createdAt: new Date().toISOString(),
          });
        } else {
          await updateDoc(userRef, {
            email: user.email,
            username: user.displayName || username,
            profilePicture: user.photoURL || profilePicture,
          });
        }
      } catch (error) {
        console.error("Error checking user in database: ", error);
      }
    };

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('newMapCreated', (newMap) => {
      setMaps((prevMaps) => [...prevMaps, newMap]);
      console.log('New map created:', newMap);
    });

    checkUserInDatabase();

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (!file) {
      setError("No file selected.");
      return;
    }

    const validExtensions = [".jpg"];
    const fileName = file.name.toLowerCase();
    const isValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValidExtension) {
      setError("Please upload a valid .jpg image file.");
      return;
    }

    try {
      const storageRef = ref(storage, `profilePictures/${user.uid}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setProfilePicture(url);
      setError("");
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload the image. Please try again.");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const usersQuery = query(collection(db, "users"), where("username", "==", username));
      const existingUsers = await getDocs(usersQuery);
      if (!existingUsers.empty) {
        const matchingUser = existingUsers.docs.find((doc) => doc.id !== user.uid);
        if (matchingUser) {
          setError("Username is already taken. Please choose another one.");
          return;
        }
      }
      if (auth.currentUser) {
        const profileData = {
          displayName: username,
          photoURL: profilePicture,
        };
        await updateProfile(auth.currentUser, profileData);
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { username });
        alert("Profile updated successfully!");
        setShowProfileDetails(false);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const createNewMap = async (e) => {
    e.preventDefault();
    if (!newMapName.trim()) return;
    try {
      const docRef = await addDoc(collection(db, "maps"), {
        name: newMapName,
        nodes: [],
        edges: [],
        userId: user.uid,
        participants: [user.uid],
        createdAt: new Date()
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
    setJoinSuccessMessage("");
    setError("");
  
    if (!joinMapName.trim() || !joinMapId.trim()) {
      setError("Please provide both the map name and ID.");
      return;
    }
  
    try {
      // Fetch the map by document ID directly
      const mapDocRef = doc(db, "maps", joinMapId);
      const mapDocSnap = await getDoc(mapDocRef);
  
      if (mapDocSnap.exists()) {
        const mapData = mapDocSnap.data();
  
        // Check if the map name matches
        if (mapData.name === joinMapName) {
          // Check if the user is already a participant
          if(mapData.participants && mapData.participants.includes(user.uid)) {
            setJoinSuccessMessage("You have already joined this map.");
          } else {
            // Add the user to participants
            await updateDoc(mapDocRef, {
              participants: arrayUnion(user.uid),
            });
  

  
            setJoinSuccessMessage("You have successfully joined the map.");
            setJoinMapName("");
            setJoinMapId(""); // Clear input fields only on successful join
          }
        } else {
          setError("The map name does not match the provided ID.");
        }
      } else {
        setError("No map found with the provided ID.");
      }
    } catch (err) {
      console.error("Error joining map:", err.message);
      setError("An error occurred while trying to join the map. Please try again.");
    }
  };
  
  
  
  const cancelJoinMap = () => {
    setJoinMapName("");
    setJoinMapId("");
    setIsJoinInputVisible(false); // Close the modal
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
      <header className="dashboard-header">
        <div className="header-left">
          <div className="user-info">
            <img src={profilePicture} alt="Profile" className="profile-picture" />
            <h2>Hi {username || "User"} ;)</h2>
            <button
              className="details-button"
              onClick={() => setShowProfileDetails(true)}
            >
              User Details
            </button>
          </div>
        </div>
        <div className="header-right">
          <button className="card-button logout-button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </header>

      {showProfileDetails && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Your Profile</h2>
              <button
                className="close-button"
                onClick={() => setShowProfileDetails(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Profile Picture:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="form-input"
                />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div className="form-actions">
                <button type="submit" className="action-button">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="button-container">
        {!isCreateInputVisible && (
          <button className="card-button" onClick={() => setIsCreateInputVisible(true)}>
            Create New Map
          </button>
        )}

        {!isJoinInputVisible && (
          <button className="card-button" onClick={() => setIsJoinInputVisible(true)}>
            Join Map
          </button>
        )}
      </div>

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

      {isJoinInputVisible && (
        <div className="modal">
          <div className="modal-content">
            <form onSubmit={joinMap} className="new-map-form">
              <input
                type="text"
                value={joinMapName}
                onChange={(e) => setJoinMapName(e.target.value)}
                placeholder="Enter map name"
                className="new-map-input"
              />
              <input
                type="text"
                value={joinMapId}
                onChange={(e) => setJoinMapId(e.target.value)}
                placeholder="Enter map ID"
                className="new-map-input"
              />
              {joinSuccessMessage && <p className="success-text">{joinSuccessMessage}</p>}
              {error && <p className="error-text">{error}</p>}
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
