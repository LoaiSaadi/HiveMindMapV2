
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import MapEditor from "./components/MapEditor";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

// Setup Socket.IO client
const socket = io("http://localhost:5000");

const App = () => {
  const [user, setUser] = useState(null);

  // Handle authentication and Socket.IO setup
  useEffect(() => {
    console.log("Initializing App...");

    // Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        console.log("User logged in:", currentUser);
      } else {
        console.log("No user is logged in.");
      }
    });

    // Socket.IO connection setup
    socket.on("connect", () => {
      console.log("Socket connected with ID:", socket.id);
    });

    socket.on("mapUpdate", (data) => {
      console.log("Map update received via socket:", data);
    });

    // Clean up listeners on unmount
    return () => {
      socket.off("connect");
      socket.off("mapUpdate");
      unsubscribe();
    };
  }, []);

  // Redirect to login if user is not authenticated
  if (!user) {
    console.log("No user authenticated. Redirecting to login...");
    return <LoginPage onLogin={() => console.log("Login triggered")} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard Route */}
        <Route path="/" element={<DashboardWrapper user={user} />} />

        {/* Map Editor Route */}
        <Route path="/map/:mapId" element={<MapEditorWithParams />} />
      </Routes>
    </BrowserRouter>
  );
};

// Dashboard Wrapper Component (passes user to Dashboard)
const DashboardWrapper = ({ user }) => {
  useEffect(() => {
    console.log("Dashboard rendered with user:", user);
  }, [user]);

  return <Dashboard user={user} />;
};

// Map Editor with URL params
const MapEditorWithParams = () => {
  const { mapId } = useParams(); // Extract mapId from URL
  return <MapEditor mapId={mapId} />;
};

export default App;
