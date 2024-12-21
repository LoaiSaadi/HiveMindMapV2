
// // import React, { useState, useEffect } from "react";
// // import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
// // import LoginPage from "./components/LoginPage";
// // import Dashboard from "./components/Dashboard";
// // import { auth } from "./firebase";
// // import { onAuthStateChanged } from "firebase/auth";
// // import MapEditor from "./components/MapEditor";
// // import { useParams } from "react-router-dom"; // Import the useParams hook

// // const App = () => {
// //   const [user, setUser] = useState(null);

// //   useEffect(() => {
// //     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
// //       setUser(currentUser);
// //     });
// //     return () => unsubscribe();
// //   }, []);

// //   const handleLogin = () => {
// //     // You can update this function to handle login state change or redirect after successful login
// //     console.log("User logged in");
// //   };

// //   if (!user) {
// //     return <LoginPage onLogin={handleLogin} />; // Pass onLogin as a prop
// //   }

// //   return (
// //     <Router>
// //       <Routes>
// //         <Route path="/" element={<Dashboard user={user} />} />
// //         <Route path="/map/:mapId" element={<MapEditorWithParams />} />
// //       </Routes>
// //     </Router>
// //   );
// // };

// // // MapEditorWithParams component to fetch mapId from URL and pass it to MapEditor
// // const MapEditorWithParams = () => {
// //   const { mapId } = useParams(); // Extract mapId from URL params
// //   return <MapEditor mapId={mapId} />;
// // };

// // export default App;

// import React, { useState, useEffect } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import LoginPage from "./components/LoginPage";
// import Dashboard from "./components/Dashboard";
// import { auth } from "./firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import MapEditor from "./components/MapEditor";
// import { useParams } from "react-router-dom"; // Import useParams hook

// const App = () => {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//     });
//     return () => unsubscribe();
//   }, []);

//   const handleLogin = () => {
//     // This function can be used to handle login state change or redirect after login
//     console.log("User logged in");
//   };

//   if (!user) {
//     return <LoginPage onLogin={handleLogin} />; // Pass onLogin as a prop
//   }

//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Dashboard user={user} />} />
//         <Route path="/map/:mapId" element={<MapEditorWithParams />} />
//       </Routes>
//     </Router>
//   );
// };

// // MapEditorWithParams component to fetch mapId from URL and pass it to MapEditor
// const MapEditorWithParams = () => {
//   const { mapId } = useParams(); // Extract mapId from URL params
//   return <MapEditor mapId={mapId} />;
// };

// export default App;
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Fixed import
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import MapEditor from "./components/MapEditor";
import { useParams } from "react-router-dom"; // Import useParams hook
import io from "socket.io-client"; // Import Socket.IO client

const socket = io("http://localhost:5000"); // Assuming your Socket.IO server is running on port 5000

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Setup Socket.IO events
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id); // Log when connected to the server
    });

    // Example event listener (you can replace with your own events)
    socket.on("mapUpdate", (data) => {
      console.log("Map updated:", data); // Handle the map update event
    });

    // Clean up the socket connection when the component is unmounted
    return () => {
      socket.off("connect");
      socket.off("mapUpdate");
      unsubscribe(); // Clean up the Firebase listener as well
    };
  }, []);
  console.log("step -2");
  
  const handleLogin = () => {
    console.log("step -1");
    console.log("Navigating to Dashboard - User Data:", user);
    // This function can be used to handle login state change or redirect after login
    console.log("User logged in");
  };

  if (!user) {
    console.log("step 0");
    return <LoginPage onLogin={handleLogin} />; // Pass onLogin as a prop
  }

  return (
    <BrowserRouter>
      <Routes>
        console.log("step 1");
        console.log("Navigating to Dashboard - User Data:", user);
        <Route path="/" element={<DashboardWrapper user={user} />} />
        <Route path="/map/:mapId" element={<MapEditorWithParams />} />
      </Routes>
    </BrowserRouter>
  );
};

// Wrapper for Dashboard to pass props
const DashboardWrapper = ({ user }) => {
  useEffect(() => {
    console.log("Everything is working correctly");
    console.log("Navigating to Dashboard - User Data:", user); // This will log user data whenever the DashboardWrapper is rendered
    console.log("Everything is working correctly"); // This will log a note to check if everything works
  }, [user]);
  return <Dashboard user={user} />;
};

// MapEditorWithParams component to fetch mapId from URL and pass it to MapEditor
const MapEditorWithParams = () => {
  const { mapId } = useParams(); // Extract mapId from URL params
  return <MapEditor mapId={mapId} />;
};

export default App;
