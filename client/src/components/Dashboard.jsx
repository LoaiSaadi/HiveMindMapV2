// import React, { useState, useEffect } from "react";
// import { supabase } from "../supabase"; // Import your Supabase client
// import MapEditor from "./MapEditor";
// import { useNavigate } from "react-router-dom";
// import "../styles/Dashboard.css";

// const Dashboard = ({ user }) => {
//   const [maps, setMaps] = useState([]);
//   const [selectedMapId, setSelectedMapId] = useState(null);
//   const [newMapName, setNewMapName] = useState("");
//   const [joinMapName, setJoinMapName] = useState("");
//   const [joinMapId, setJoinMapId] = useState("");
//   const [isCreateInputVisible, setIsCreateInputVisible] = useState(false);
//   const [isJoinInputVisible, setIsJoinInputVisible] = useState(false);
//   const [confirmDelete, setConfirmDelete] = useState({ isVisible: false, mapId: null, mapName: "" });

//   const [showProfileDetails, setShowProfileDetails] = useState(false);
//   const [username, setUsername] = useState(user.user_metadata?.full_name || "");
//   const [profilePicture, setProfilePicture] = useState(user.user_metadata?.avatar_url || "");
//   const [email, setEmail] = useState(user.email || "");
//   const [error, setError] = useState("");
//   const [joinSuccessMessage, setJoinSuccessMessage] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [allMaps, setAllMaps] = useState([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchUserMaps = async () => {
//       try {
//         // Get maps where the user is a participant
//         const { data: mapsData, error: mapsError } = await supabase
//           .from('maps')
//           .select('*')
//           .contains('participants', [user.id]);

//         if (mapsError) throw mapsError;

//         setAllMaps(mapsData || []);
//         setMaps(mapsData || []);
//       } catch (error) {
//         console.error("Error fetching maps:", error.message);
//       }
//     };

//     fetchUserMaps();


//     const fetchUsers = async () => {
//       try {
//         // 1. Get current logged-in user from Supabase auth
//         const { data: { user }, error: userError } = await supabase.auth.getUser();

//         if (userError) throw userError;
//         if (!user) throw new Error("No logged-in user found");

//         // 2. Fetch from your custom 'users' table
//         const { data, error } = await supabase
//           .from('users')
//           .select('username, email')
//           .eq('id', user.id) // 'id' must match the one in your 'users' table
//           .single();

//         if (error) throw error;

//         console.log("Fetched user dataaa:", data);
//         console.log("Fetched user data username and email:", data.username, data.email);

//         if (data) {
//           setUsername(data.username || "");
//           setEmail(data.email || "");
//         }
//       } catch (error) {
//         setError("Failed to load profile data. Please try again.");
//         console.error("Profile fetch error:", error);
//       }
//     };

//     fetchUsers();


//     // const fetchUsers = async () => {
//     //   try {
//     //     // Supabase equivalent
//     //     const { data, error } = await supabase
//     //       .from('users')
//     //       .select('username, email')
//     //       .eq('id', user.id) // Assuming 'user' comes from Supabase auth
//     //       .single(); // Expects exactly one row

//     //     console.log("Fetched user data:", data);
        
//     //     if (error) throw error;
        
//     //     if (data) {
//     //       //setProfilePicture(data.profile_picture || "");
//     //       setUsername(data.username || "");
//     //       setEmail(data.email || "");
//     //     }
//     //   } catch (error) {
//     //     setError("Failed to load profile data. Please try again.");
//     //     console.error("Profile fetch error:", error);
//     //   }
//     // };

//     // fetchUsers();

//     // Set up real-time subscription
//     const subscription = supabase
//       .channel('maps_changes')
//       .on('postgres_changes', {
//         event: '*',
//         schema: 'public',
//         table: 'maps'
//       }, payload => {
//         fetchUserMaps(); // Refresh maps when changes occur
//       })
//       .subscribe();

//     return () => {
//       supabase.removeChannel(subscription);
//     };
//   }, [user.id]);

//   const handleSearch = (e) => {
//     const term = e.target.value.toLowerCase();
//     setSearchTerm(term);

//     if (term === "") {
//       setMaps(allMaps);
//       return;
//     }

//     const filteredMaps = allMaps.filter((map) =>
//       map.name.toLowerCase().includes(term)
//     );
//     setMaps(filteredMaps);
//   };

//   const handleFileChange = async (e) => {
//     const file = e.target.files[0];
//     if (file && file.type.startsWith("image/")) {
//       const fileExt = file.name.split('.').pop();
//       const fileName = `${user.id}${Math.random()}.${fileExt}`;
//       const filePath = `${fileName}`;

//       // Upload the file to Supabase Storage
//       const { error: uploadError } = await supabase.storage
//         .from('avatars')
//         .upload(filePath, file);

//       if (uploadError) {
//         setError("Failed to upload image.");
//         return;
//       }

//       // Get the public URL
//       const { data: { publicUrl } } = supabase.storage
//         .from('avatars')
//         .getPublicUrl(filePath);

//       setProfilePicture(publicUrl);
//     } else {
//       setError("Please upload a valid image file.");
//     }
//   };

//   const handleProfileUpdate = async (e) => {
//     e.preventDefault();
//     setError("");
//     try {
//       // Check if username exists
//       const { data: existingUsers, error: userError } = await supabase
//         .from('users') // ex 'profiles'
//         .select('username')
//         .eq('username', username)
//         .neq('id', user.id);

//       if (userError) throw userError;

//       if (existingUsers && existingUsers.length > 0) {
//         setError("Username is already taken. Please choose another one.");
//         return;
//       }

//       // Update profile in Supabase
//       const { error: updateError } = await supabase
//         .from('users') // ex 'profiles'
//         .update({
//           username,
//           //avatar_url: profilePicture,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', user.id);

//       if (updateError) throw updateError;

//       // Update auth user metadata
//       const { error: authError } = await supabase.auth.updateUser({
//         data: {
//           full_name: username,
//           //avatar_url: profilePicture
//         }
//       });

//       if (authError) throw authError;

//       setShowProfileDetails(false);
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   // const createNewMap = async (e) => {
//   //   e.preventDefault();
//   //   if (!newMapName.trim()) return;
//   //   try {
//   //     const { data: newMap, error } = await supabase
//   //       .from('maps')
//   //       .insert([{
//   //         name: newMapName,
//   //         nodes: [],
//   //         edges: [],
//   //         user_id: user.id,
//   //         participants: [user.id],
//   //         created_at: new Date().toISOString()
//   //       }])
//   //       .select();

//   //     if (error) throw error;

//   //     setNewMapName("");
//   //     setSelectedMapId(newMap[0].id);
//   //     setIsCreateInputVisible(false);
//   //   } catch (err) {
//   //     console.error("Error creating map:", err.message);
//   //   }
//   // };

//   const createNewMap = async (e) => {
//     e.preventDefault();
//     if (!newMapName.trim()) return;
//     try {
//       // First get the current user
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user?.id) throw new Error("User not authenticated");

//       const { data: newMap, error } = await supabase
//         .from('maps')
//         .insert({
//           name: newMapName.trim(), // Ensure we use the provided name
//           nodes: [],
//           edges: [],
//           user_id: user.id,
//           participants: [user.id],
//           created_at: new Date().toISOString()
//         })
//         .select()
//         .single(); // Use single() to get just one record

//       console.log("new map: ", newMap);

//       if (error) throw error;

//       setNewMapName("");
//       setSelectedMapId(newMap.id);
//       setIsCreateInputVisible(false);
      
//       // Refresh your maps list or navigate to the new map
//       // Example: fetchMaps(); or navigate(`/map/${newMap.id}`);
      
//     } catch (err) {
//       console.error("Error creating map:", err.message);
//     }
// };

//   const handleDeleteClick = (mapId, mapName) => {
//     setConfirmDelete({ isVisible: true, mapId, mapName });
//   };

//   const confirmDeleteMap = async () => {
//     const { mapId } = confirmDelete;
//     try {
//       const { error } = await supabase
//         .from('maps')
//         .delete()
//         .eq('id', mapId);

//       if (error) throw error;

//       setMaps((prevMaps) => prevMaps.filter((map) => map.id !== mapId));
//       setConfirmDelete({ isVisible: false, mapId: null, mapName: "" });
//     } catch (err) {
//       console.error("Error deleting map:", err.message);
//     }
//   };

//   const cancelDelete = () => {
//     setConfirmDelete({ isVisible: false, mapId: null, mapName: "" });
//   };


// const joinMap = async (e) => {
//   e.preventDefault();
//   setJoinSuccessMessage("");
//   setError("");

//   const trimmedName = joinMapName.trim();
//   const trimmedId = joinMapId.trim();

//   if (!trimmedName || !trimmedId) {
//     setError("Please provide both the map name and ID.");
//     return;
//   }

//   try {
//     const {
//       data: { user },
//       error: userError,
//     } = await supabase.auth.getUser();

//     if (userError || !user) {
//       setError("You must be logged in to join a map.");
//       return;
//     }

//     const { data, error: mapError } = await supabase
//       .from("maps")
//       .select("id, name, participants, is_public")
//       .eq("id", trimmedId)
//       .limit(1);

//     console.log("joinMap select result:", { data, mapError });

//     if (mapError) {
//       console.error("Supabase error when fetching map:", mapError);
//       setError("An error occurred while trying to join the map. Please try again.");
//       return;
//     }

//     const mapData = data?.[0] || null;

//     if (!mapData) {
//       setError("No map found with the provided ID.");
//       return;
//     }

//     if (mapData.name !== trimmedName) {
//       setError("The map name does not match the provided ID.");
//       return;
//     }

//     const participants = Array.isArray(mapData.participants)
//       ? mapData.participants
//       : [];

//     if (participants.includes(user.id)) {
//       setJoinSuccessMessage("You have already joined this map.");
//       return;
//     }

//     const newParticipants = [...participants, user.id];

//     const { error: updateError } = await supabase
//       .from("maps")
//       .update({ participants: newParticipants })
//       .eq("id", trimmedId);

//     if (updateError) {
//       console.error("Supabase error when updating participants:", updateError);
//       setError("An error occurred while trying to join the map. Please try again.");
//       return;
//     }

//     setJoinSuccessMessage("You have successfully joined the map.");
//     setJoinMapName("");
//     setJoinMapId("");

//     // optional
//     // navigate(`/map/${trimmedId}`);
//   } catch (err) {
//     console.error("Unexpected error joining map:", err);
//     setError("An error occurred while trying to join the map. Please try again.");
//   }
// };

//   // const joinMap = async (e) => {
//   //   e.preventDefault();
//   //   setJoinSuccessMessage("");
//   //   setError("");

//   //   if (!joinMapName.trim() || !joinMapId.trim()) {
//   //     setError("Please provide both the map name and ID.");
//   //     return;
//   //   }

//   //   try {
//   //     // Get the map
//   //     const { data: mapData, error: mapError } = await supabase
//   //       .from('maps')
//   //       .select('*')
//   //       .eq('id', joinMapId)
//   //       .single();

//   //     if (mapError) throw mapError;
//   //     if (!mapData) {
//   //       setError("No map found with the provided ID.");
//   //       return;
//   //     }

//   //     if (mapData.name !== joinMapName) {
//   //       setError("The map name does not match the provided ID.");
//   //       return;
//   //     }

//   //     if (mapData.participants && mapData.participants.includes(user.id)) {
//   //       setJoinSuccessMessage("You have already joined this map.");
//   //       return;
//   //     }

//   //     // Update the map to add the user as a participant
//   //     const { error: updateError } = await supabase
//   //       .from('maps')
//   //       .update({
//   //         participants: [...mapData.participants, user.id]
//   //       })
//   //       .eq('id', joinMapId);

//   //     if (updateError) throw updateError;

//   //     setJoinSuccessMessage("You have successfully joined the map.");
//   //     setJoinMapName("");
//   //     setJoinMapId("");
//   //   } catch (err) {
//   //     console.error("Error joining map:", err.message);
//   //     setError("An error occurred while trying to join the map. Please try again.");
//   //   }
//   // };

//   const handleUsernameChange = async (e) => {
//     const newUsername = e.target.value;
//     setUsername(newUsername);
//     try {
//       // Update both profiles table and auth metadata
//       const { error } = await supabase
//         .from('users') // ex 'profiles'
//         .update({ username: newUsername })
//         .eq('id', user.id);

//       if (error) throw error;

//       await supabase.auth.updateUser({
//         data: { full_name: newUsername }
//       });
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter") {
//       setShowProfileDetails(false);
//     }
//   };

//   const cancelJoinMap = () => {
//     setJoinMapName("");
//     setJoinMapId("");
//     setIsJoinInputVisible(false);
//   };

//   const handleLogout = async () => {
//     try {
//       const { error } = await supabase.auth.signOut();
//       if (error) throw error;
//       navigate("/");
//     } catch (error) {
//       console.error("Error logging out: ", error.message);
//     }
//   };

//   if (selectedMapId) {
//     return <MapEditor mapId={selectedMapId} />;
//   }

//   return (
//     <div className="dashboard-container">
//       <header className="dashboard-header">
//         <div className="header-left">
//           <div className="user-info">
//             {/* <img src={profilePicture} alt="Profile" className="profile-picture" /> */}
//             <h2 style={{color:"#2C5F2D" }}>Hi {username || "User"} ;)</h2>
//             <button
//               className="details-button"
//               onClick={() => setShowProfileDetails(true)}
//             >
//               User Details
//             </button>
//           </div>
//         </div>
//         <div className="header-right">
//           <button className="card-button logout-button" onClick={handleLogout}>
//             Log Out
//           </button>
//         </div>
//       </header>

//       {showProfileDetails && (
//         <div className="modal" onKeyDown={handleKeyDown} tabIndex={0}>
//           <div className="modal-content">
//             <div className="modal-header">
//               <h2>Your Profile</h2>
//               <button
//                 className="close-button"
//                 onClick={() => setShowProfileDetails(false)}
//               >
//                 &times;
//               </button>
//             </div>
//             <div className="profile-form">
//               <div className="form-group">
//                 <label>Email:</label>
//                 <input
//                   type="email"
//                   value={email}
//                   disabled
//                   className="form-input"
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Username:</label>
//                 <input
//                   type="text"
//                   value={username}
//                   onChange={handleUsernameChange}
//                   className="form-input"
//                 />
//               </div>
//               <div className="form-group">
//                 {/* <label>Profile Picture:</label>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleFileChange}
//                   className="form-input"
//                 /> */}
//               </div>
//               {error && <p className="error-text">{error}</p>}
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="button-container">
//         {!isCreateInputVisible && (
//           <button className="card-button" onClick={() => setIsCreateInputVisible(true)}>
//             Create New Map
//           </button>
//         )}

//         {!isJoinInputVisible && (
//           <button className="card-button" onClick={() => setIsJoinInputVisible(true)}>
//             Join Map
//           </button>
//         )}
//       </div>

//       {isCreateInputVisible && (
//         <div className="modal">
//           <div className="modal-content">
//             <form onSubmit={createNewMap} className="new-map-form">
//               <input
//                 type="text"
//                 value={newMapName}
//                 onChange={(e) => setNewMapName(e.target.value)}
//                 placeholder="Enter map name"
//                 className="new-map-input"
//               />
//               <div className="modal-buttons">
//                 <button type="submit" className="card-button">
//                   Create Map
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setIsCreateInputVisible(false)}
//                   className="card-button"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {isJoinInputVisible && (
//         <div className="modal">
//           <div className="modal-content">
//             <form onSubmit={joinMap} className="new-map-form">
//               <input
//                 type="text"
//                 value={joinMapName}
//                 onChange={(e) => setJoinMapName(e.target.value)}
//                 placeholder="Enter map name"
//                 className="new-map-input"
//               />
//               <input
//                 type="text"
//                 value={joinMapId}
//                 onChange={(e) => setJoinMapId(e.target.value)}
//                 placeholder="Enter map ID"
//                 className="new-map-input"
//               />
//               {joinSuccessMessage && (
//                 <div className="modal">
//                   <div className="modal-content">
//                     <p>{joinSuccessMessage}</p>
//                     <button
//                       className="close-button"
//                       onClick={() => setJoinSuccessMessage("")}
//                     >
//                       Close
//                     </button>
//                   </div>
//                 </div>
//               )}
//               {error && <p className="error-text">{error}</p>}
//               <div className="modal-buttons">
//                 <button type="submit" className="card-button">
//                   Join Map
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setIsJoinInputVisible(false)}
//                   className="card-button"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {confirmDelete.isVisible && (
//         <div className="modal">
//           <div className="modal-content">
//             <p>Are you sure you want to delete the "{confirmDelete.mapName}" map?</p>
//             <div className="modal-buttons">
//               <button className="card-button" onClick={confirmDeleteMap}>Yes</button>
//               <button className="card-button" onClick={cancelDelete}>No</button>
//             </div>
//           </div>
//         </div>
//       )}
      
//       <h3 style={{color:"#2C5F2D" }}>Your Learning Space:</h3>
//       <div className="search-container">
//         <input
//           type="text"
//           placeholder="Search learning space..."
//           value={searchTerm}
//           onChange={handleSearch}
//           className="search-input"
//         />
//       </div>
//       <div className="maps-grid">
//         {maps.map((m) => (
//           <div key={m.id} className="map-tile">
//             <button className="card-button" onClick={() => setSelectedMapId(m.id)}>
//               {m.name || m.id}
//             </button>
//             <button className="delete-button" onClick={() => handleDeleteClick(m.id, m.name)}>
//               <div className="trash-icon">
//                 <div className="lid"></div>
//                 <div className="bin">
//                   <div className="face"></div>
//                 </div>
//               </div>
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;



import React, { useState, useEffect } from "react";
import { supabase } from "../supabase"; // Import your Supabase client
import MapEditor from "./MapEditor";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const Dashboard = ({ user }) => {
  const [maps, setMaps] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [newMapName, setNewMapName] = useState("");
  const [joinMapName, setJoinMapName] = useState("");
  const [joinMapId, setJoinMapId] = useState("");
  const [isCreateInputVisible, setIsCreateInputVisible] = useState(false);
  const [isJoinInputVisible, setIsJoinInputVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    isVisible: false,
    mapId: null,
    mapName: "",
  });

  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [username, setUsername] = useState(user.user_metadata?.full_name || "");
  const [profilePicture, setProfilePicture] = useState(
    user.user_metadata?.avatar_url || ""
  );
  const [email, setEmail] = useState(user.email || "");
  const [error, setError] = useState("");
  const [joinSuccessMessage, setJoinSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [allMaps, setAllMaps] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserMaps = async () => {
      try {
        // Get maps where the user is a participant
        const { data: mapsData, error: mapsError } = await supabase
          .from("maps")
          .select("*")
          .contains("participants", [user.id]);

        if (mapsError) throw mapsError;

        setAllMaps(mapsData || []);
        setMaps(mapsData || []);
      } catch (error) {
        console.error("Error fetching maps:", error.message);
      }
    };

    const fetchUsers = async () => {
      try {
        // 1. Get current logged-in user from Supabase auth
        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!authUser) throw new Error("No logged-in user found");

        // 2. Fetch from your custom 'users' table
        const { data, error } = await supabase
          .from("users")
          .select("username, email")
          .eq("id", authUser.id)
          .single();

        if (error) throw error;

        console.log("Fetched user dataaa:", data);
        console.log(
          "Fetched user data username and email:",
          data.username,
          data.email
        );

        if (data) {
          setUsername(data.username || "");
          setEmail(data.email || "");
        }
      } catch (error) {
        setError("Failed to load profile data. Please try again.");
        console.error("Profile fetch error:", error);
      }
    };

    fetchUserMaps();
    fetchUsers();

    // Set up real-time subscription
    const subscription = supabase
      .channel("maps_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "maps",
        },
        (payload) => {
          fetchUserMaps(); // Refresh maps when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user.id]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (term === "") {
      setMaps(allMaps);
      return;
    }

    const filteredMaps = allMaps.filter((map) =>
      map.name.toLowerCase().includes(term)
    );
    setMaps(filteredMaps);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        setError("Failed to upload image.");
        return;
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setProfilePicture(publicUrl);
    } else {
      setError("Please upload a valid image file.");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Check if username exists
      const { data: existingUsers, error: userError } = await supabase
        .from("users") // ex 'profiles'
        .select("username")
        .eq("username", username)
        .neq("id", user.id);

      if (userError) throw userError;

      if (existingUsers && existingUsers.length > 0) {
        setError("Username is already taken. Please choose another one.");
        return;
      }

      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from("users") // ex 'profiles'
        .update({
          username,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: username,
        },
      });

      if (authError) throw authError;

      setShowProfileDetails(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const createNewMap = async (e) => {
    e.preventDefault();
    if (!newMapName.trim()) return;
    try {
      // First get the current user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser?.id) throw new Error("User not authenticated");

      const { data: newMap, error } = await supabase
        .from("maps")
        .insert({
          name: newMapName.trim(),
          nodes: [],
          edges: [],
          user_id: authUser.id,
          participants: [authUser.id],
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      console.log("new map: ", newMap);

      if (error) throw error;

      setNewMapName("");
      setSelectedMapId(newMap.id);
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
      const { error } = await supabase.from("maps").delete().eq("id", mapId);

      if (error) throw error;

      setMaps((prevMaps) => prevMaps.filter((map) => map.id !== mapId));
      setConfirmDelete({ isVisible: false, mapId: null, mapName: "" });
    } catch (err) {
      console.error("Error deleting map:", err.message);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete({ isVisible: false, mapId: null, mapName: "" });
  };

  // 🔴 UPDATED joinMap: after successful join, we open the map by setting selectedMapId
  const joinMap = async (e) => {
    e.preventDefault();
    setJoinSuccessMessage("");
    setError("");

    const trimmedName = joinMapName.trim();
    const trimmedId = joinMapId.trim();

    if (!trimmedName || !trimmedId) {
      setError("Please provide both the map name and ID.");
      return;
    }

    try {
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !authUser) {
        setError("You must be logged in to join a map.");
        return;
      }

      const { data, error: mapError } = await supabase
        .from("maps")
        .select("id, name, participants, is_public")
        .eq("id", trimmedId)
        .limit(1);

      console.log("joinMap select result:", { data, mapError });

      if (mapError) {
        console.error("Supabase error when fetching map:", mapError);
        setError("An error occurred while trying to join the map. Please try again.");
        return;
      }

      const mapData = data?.[0] || null;

      if (!mapData) {
        setError("No map found with the provided ID.");
        return;
      }

      if (mapData.name !== trimmedName) {
        setError("The map name does not match the provided ID.");
        return;
      }

      const participants = Array.isArray(mapData.participants)
        ? mapData.participants
        : [];

      if (!participants.includes(authUser.id)) {
        const newParticipants = [...participants, authUser.id];

        const { error: updateError } = await supabase
          .from("maps")
          .update({ participants: newParticipants })
          .eq("id", trimmedId);

        if (updateError) {
          console.error(
            "Supabase error when updating participants:",
            updateError
          );
          setError(
            "An error occurred while trying to join the map. Please try again."
          );
          return;
        }
      }

      setJoinSuccessMessage("You have successfully joined the map.");
      setJoinMapName("");
      setJoinMapId("");
      setIsJoinInputVisible(false);

      // 🔴 HERE: open the joined map in MapEditor
      setSelectedMapId(trimmedId);
    } catch (err) {
      console.error("Unexpected error joining map:", err);
      setError("An error occurred while trying to join the map. Please try again.");
    }
  };

  const handleUsernameChange = async (e) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    try {
      const { error } = await supabase
        .from("users") // ex 'profiles'
        .update({ username: newUsername })
        .eq("id", user.id);

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { full_name: newUsername },
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setShowProfileDetails(false);
    }
  };

  const cancelJoinMap = () => {
    setJoinMapName("");
    setJoinMapId("");
    setIsJoinInputVisible(false);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      console.error("Error logging out: ", error.message);
    }
  };

  // When a map is selected (created or joined) – show the editor instead of dashboard
  if (selectedMapId) {
    return <MapEditor mapId={selectedMapId} />;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="user-info">
            <h2 style={{ color: "#2C5F2D" }}>Hi {username || "User"} ;)</h2>
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
        <div className="modal" onKeyDown={handleKeyDown} tabIndex={0}>
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
            <div className="profile-form">
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
                  onChange={handleUsernameChange}
                  className="form-input"
                />
              </div>
              <div className="form-group"></div>
              {error && <p className="error-text">{error}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="button-container">
        {!isCreateInputVisible && (
          <button
            className="card-button"
            onClick={() => setIsCreateInputVisible(true)}
          >
            Create New Map
          </button>
        )}

        {!isJoinInputVisible && (
          <button
            className="card-button"
            onClick={() => setIsJoinInputVisible(true)}
          >
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
              {joinSuccessMessage && (
                <p className="success-text">{joinSuccessMessage}</p>
              )}
              {error && <p className="error-text">{error}</p>}
              <div className="modal-buttons">
                <button type="submit" className="card-button">
                  Join Map
                </button>
                <button
                  type="button"
                  onClick={cancelJoinMap}
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
            <p>
              Are you sure you want to delete the "{confirmDelete.mapName}" map?
            </p>
            <div className="modal-buttons">
              <button className="card-button" onClick={confirmDeleteMap}>
                Yes
              </button>
              <button className="card-button" onClick={cancelDelete}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      <h3 style={{ color: "#2C5F2D" }}>Your Learning Space:</h3>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search learning space..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
      <div className="maps-grid">
        {maps.map((m) => (
          <div key={m.id} className="map-tile">
            <button
              className="card-button"
              onClick={() => setSelectedMapId(m.id)}
            >
              {m.name || m.id}
            </button>
            <button
              className="delete-button"
              onClick={() => handleDeleteClick(m.id, m.name)}
            >
              <div className="trash-icon">
                <div className="lid"></div>
                <div className="bin">
                  <div className="face"></div>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
