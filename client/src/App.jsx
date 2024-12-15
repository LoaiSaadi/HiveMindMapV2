// import React, { useState, useEffect } from "react";
// import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
// import LoginPage from "./components/LoginPage";
// import Dashboard from "./components/Dashboard";
// import { auth } from "./firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import MapEditor from "./components/MapEditor";
// import { useParams } from "react-router-dom"; // Import the useParams hook

// const App = () => {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//     });
//     return () => unsubscribe();
//   }, []);


//   if (!user) {
//     return <LoginPage />;
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

// import React, { useState, useEffect } from "react";
// import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
// import LoginPage from "./components/LoginPage";
// import Dashboard from "./components/Dashboard";
// import { auth } from "./firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import MapEditor from "./components/MapEditor";
// import { useParams } from "react-router-dom"; // Import the useParams hook

// const App = () => {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//     });
//     return () => unsubscribe();
//   }, []);

//   const handleLogin = () => {
//     // You can update this function to handle login state change or redirect after successful login
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
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import MapEditor from "./components/MapEditor";
import { useParams } from "react-router-dom"; // Import the useParams hook

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    // You can update this function to handle login state change or redirect after successful login
    console.log("User logged in");
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />; // Pass onLogin as a prop
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/map/:mapId" element={<MapEditorWithParams />} />
      </Routes>
    </Router>
  );
};

// MapEditorWithParams component to fetch mapId from URL and pass it to MapEditor
const MapEditorWithParams = () => {
  const { mapId } = useParams(); // Extract mapId from URL params
  return <MapEditor mapId={mapId} />;
};

export default App;
