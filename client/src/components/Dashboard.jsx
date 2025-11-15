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

  // -------------------------------------------------------
  // Load maps where current user is in "participants" array
  // -------------------------------------------------------
  useEffect(() => {
    const fetchUserMaps = async () => {
      try {
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
        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!authUser) throw new Error("No logged-in user found");

        const { data, error } = await supabase
          .from("users")
          .select("username, email")
          .eq("id", authUser.id)
          .single();

        if (error) throw error;

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

    // Re-fetch maps when the "maps" table changes
    const subscription = supabase
      .channel("maps_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "maps",
        },
        () => {
          fetchUserMaps();
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

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        setError("Failed to upload image.");
        return;
      }

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
      const { data: existingUsers, error: userError } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .neq("id", user.id);

      if (userError) throw userError;

      if (existingUsers && existingUsers.length > 0) {
        setError("Username is already taken. Please choose another one.");
        return;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          username,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

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
          participants: [authUser.id], // creator is first participant
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setNewMapName("");
      setSelectedMapId(newMap.id); // open map immediately
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

  // -------------------------------------------------------
  // NEW joinMap – adds user to maps.participants and
  // opens the editor immediately
  // -------------------------------------------------------
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
      // current logged-in user
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.error("joinMap / auth error:", authError);
        setError("You must be logged in to join a map.");
        return;
      }

      // fetch map by ID
      const { data: mapRow, error: mapError } = await supabase
        .from("maps")
        .select("id, name, participants")
        .eq("id", trimmedId)
        .maybeSingle();

      console.log("joinMap select result:", { mapRow, mapError });

      if (mapError) {
        console.error("Supabase error when fetching map:", mapError);
        setError(
          "An error occurred while trying to join the map. Please try again."
        );
        return;
      }

      if (!mapRow) {
        setError("No map found with the provided ID.");
        return;
      }

      // name must match
      if (mapRow.name !== trimmedName) {
        setError("The map name does not match the provided ID.");
        return;
      }

      const currentParticipants = Array.isArray(mapRow.participants)
        ? mapRow.participants
        : [];

      // already in the list → just open the map
      if (currentParticipants.includes(authUser.id)) {
        setJoinSuccessMessage("You have already joined this map.");
      } else {
        // merge + dedupe
        const finalParticipants = Array.from(
          new Set([...currentParticipants, authUser.id])
        );

        console.log("joinMap finalParticipants (local):", finalParticipants);

        // update participants in DB
        const { data: updatedRow, error: updateError } = await supabase
          .from("maps")
          .update({ participants: finalParticipants })
          .eq("id", trimmedId)
          .select("id, participants")
          .maybeSingle();

        console.log("joinMap update result:", { updatedRow, updateError });

        if (updateError) {
          setError(
            "An error occurred while trying to join the map. Please try again."
          );
          return;
        }

        // keep local state in sync so Participant component sees 2 users
        setAllMaps((prev) => {
          const exists = prev.find((m) => m.id === trimmedId);
          if (exists) {
            return prev.map((m) =>
              m.id === trimmedId
                ? { ...m, participants: finalParticipants }
                : m
            );
          }
          return [
            ...prev,
            { id: trimmedId, name: mapRow.name, participants: finalParticipants },
          ];
        });

        setMaps((prev) => {
          const exists = prev.find((m) => m.id === trimmedId);
          if (exists) {
            return prev.map((m) =>
              m.id === trimmedId
                ? { ...m, participants: finalParticipants }
                : m
            );
          }
          return [
            ...prev,
            { id: trimmedId, name: mapRow.name, participants: finalParticipants },
          ];
        });

        setJoinSuccessMessage("You have successfully joined the map.");
      }

      // clear form + open map
      setJoinMapName("");
      setJoinMapId("");
      setIsJoinInputVisible(false);
      setSelectedMapId(trimmedId);
    } catch (err) {
      console.error("Unexpected error in joinMap:", err);
      setError(
        "An error occurred while trying to join the map. Please try again."
      );
    }
  };

  const handleUsernameChange = async (e) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    try {
      const { error } = await supabase
        .from("users")
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

  // -------------------------------------------------------
  // When a map is selected (created or joined) – show editor
  // -------------------------------------------------------
  if (selectedMapId) {
    return <MapEditor mapId={selectedMapId} />;
  }

  // ========= Dashboard UI =========
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
              <div className="form-group">{/* profile pic input if you want */}</div>
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
//   const [confirmDelete, setConfirmDelete] = useState({
//     isVisible: false,
//     mapId: null,
//     mapName: "",
//   });

//   const [showProfileDetails, setShowProfileDetails] = useState(false);
//   const [username, setUsername] = useState(user.user_metadata?.full_name || "");
//   const [profilePicture, setProfilePicture] = useState(
//     user.user_metadata?.avatar_url || ""
//   );
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
//           .from("maps")
//           .select("*")
//           .contains("participants", [user.id]);

//         if (mapsError) throw mapsError;

//         setAllMaps(mapsData || []);
//         setMaps(mapsData || []);
//       } catch (error) {
//         console.error("Error fetching maps:", error.message);
//       }
//     };

//     const fetchUsers = async () => {
//       try {
//         // 1. Get current logged-in user from Supabase auth
//         const {
//           data: { user: authUser },
//           error: userError,
//         } = await supabase.auth.getUser();

//         if (userError) throw userError;
//         if (!authUser) throw new Error("No logged-in user found");

//         // 2. Fetch from your custom 'users' table
//         const { data, error } = await supabase
//           .from("users")
//           .select("username, email")
//           .eq("id", authUser.id)
//           .single();

//         if (error) throw error;

//         console.log("Fetched user dataaa:", data);
//         console.log(
//           "Fetched user data username and email:",
//           data.username,
//           data.email
//         );

//         if (data) {
//           setUsername(data.username || "");
//           setEmail(data.email || "");
//         }
//       } catch (error) {
//         setError("Failed to load profile data. Please try again.");
//         console.error("Profile fetch error:", error);
//       }
//     };

//     fetchUserMaps();
//     fetchUsers();

//     // Set up real-time subscription
//     const subscription = supabase
//       .channel("maps_changes")
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "maps",
//         },
//         (payload) => {
//           fetchUserMaps(); // Refresh maps when changes occur
//         }
//       )
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
//       const fileExt = file.name.split(".").pop();
//       const fileName = `${user.id}${Math.random()}.${fileExt}`;
//       const filePath = `${fileName}`;

//       // Upload the file to Supabase Storage
//       const { error: uploadError } = await supabase.storage
//         .from("avatars")
//         .upload(filePath, file);

//       if (uploadError) {
//         setError("Failed to upload image.");
//         return;
//       }

//       // Get the public URL
//       const {
//         data: { publicUrl },
//       } = supabase.storage.from("avatars").getPublicUrl(filePath);

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
//         .from("users") // ex 'profiles'
//         .select("username")
//         .eq("username", username)
//         .neq("id", user.id);

//       if (userError) throw userError;

//       if (existingUsers && existingUsers.length > 0) {
//         setError("Username is already taken. Please choose another one.");
//         return;
//       }

//       // Update profile in Supabase
//       const { error: updateError } = await supabase
//         .from("users") // ex 'profiles'
//         .update({
//           username,
//           updated_at: new Date().toISOString(),
//         })
//         .eq("id", user.id);

//       if (updateError) throw updateError;

//       // Update auth user metadata
//       const { error: authError } = await supabase.auth.updateUser({
//         data: {
//           full_name: username,
//         },
//       });

//       if (authError) throw authError;

//       setShowProfileDetails(false);
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   const createNewMap = async (e) => {
//     e.preventDefault();
//     if (!newMapName.trim()) return;
//     try {
//       // First get the current user
//       const {
//         data: { user: authUser },
//       } = await supabase.auth.getUser();
//       if (!authUser?.id) throw new Error("User not authenticated");

//       const { data: newMap, error } = await supabase
//         .from("maps")
//         .insert({
//           name: newMapName.trim(),
//           nodes: [],
//           edges: [],
//           user_id: authUser.id,
//           participants: [authUser.id],
//           created_at: new Date().toISOString(),
//         })
//         .select()
//         .single();

//       console.log("new map: ", newMap);

//       if (error) throw error;

//       setNewMapName("");
//       setSelectedMapId(newMap.id);
//       setIsCreateInputVisible(false);
//     } catch (err) {
//       console.error("Error creating map:", err.message);
//     }
//   };

//   const handleDeleteClick = (mapId, mapName) => {
//     setConfirmDelete({ isVisible: true, mapId, mapName });
//   };

//   const confirmDeleteMap = async () => {
//     const { mapId } = confirmDelete;
//     try {
//       const { error } = await supabase.from("maps").delete().eq("id", mapId);

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


//   const joinMap = async (e) => {
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
//     // 1. Current logged-in user
//     const {
//       data: { user },
//       error: userError,
//     } = await supabase.auth.getUser();

//     if (userError || !user) {
//       console.error("joinMap / auth error:", userError);
//       setError("You must be logged in to join a map.");
//       return;
//     }

//     // 2. Get the map by ID
//     const { data: mapsData, error: mapError } = await supabase
//       .from("maps")
//       .select("id, name, participants")
//       .eq("id", trimmedId)
//       .limit(1);

//     console.log("joinMap select result:", { mapsData, mapError });

//     if (mapError) {
//       console.error("Supabase error when fetching map:", mapError);
//       setError("An error occurred while trying to join the map. Please try again.");
//       return;
//     }

//     const mapData = mapsData?.[0] || null;

//     if (!mapData) {
//       setError("No map found with the provided ID.");
//       return;
//     }

//     // 3. Name must match
//     if (mapData.name !== trimmedName) {
//       setError("The map name does not match the provided ID.");
//       return;
//     }

//     // 4. Build participants array
//     const participants = Array.isArray(mapData.participants)
//       ? [...mapData.participants]
//       : [];

//     // Already there?
//     if (participants.includes(user.id)) {
//       setJoinSuccessMessage("You have already joined this map.");
//       return;
//     }

//     // Add this user
//     participants.push(user.id);

//     // 5. Update the map (NO select() here → avoids 406 / PGRST116)
//     const { error: updateError } = await supabase
//       .from("maps")
//       .update({ participants })
//       .eq("id", trimmedId);

//     if (updateError) {
//       console.error("Supabase error when updating participants:", updateError);
//       setError("An error occurred while trying to join the map. Please try again.");
//       return;
//     }

//     console.log("joinMap updated participants (local):", participants);

//     // 6. Update local state so ParticipantList sees 2 users
//     setAllMaps((prev) => {
//       const exists = prev.find((m) => m.id === trimmedId);
//       if (exists) {
//         return prev.map((m) =>
//           m.id === trimmedId ? { ...m, participants } : m
//         );
//       }
//       return [...prev, { id: trimmedId, name: mapData.name, participants }];
//     });

//     setMaps((prev) => {
//       const exists = prev.find((m) => m.id === trimmedId);
//       if (exists) {
//         return prev.map((m) =>
//           m.id === trimmedId ? { ...m, participants } : m
//         );
//       }
//       return [...prev, { id: trimmedId, name: mapData.name, participants }];
//     });

//     // 7. Success UI
//     setJoinSuccessMessage("You have successfully joined the map.");
//     setJoinMapName("");
//     setJoinMapId("");

//     // Optional: immediately open the map
//     // setSelectedMapId(trimmedId);
//     // or: navigate(`/map/${trimmedId}`);
//   } catch (err) {
//     console.error("Unexpected error in joinMap:", err);
//     setError("An error occurred while trying to join the map. Please try again.");
//   }
// };


//   // // 🔴 UPDATED joinMap: after successful join, we open the map by setting selectedMapId
//   // const joinMap = async (e) => {
//   //   e.preventDefault();
//   //   setJoinSuccessMessage("");
//   //   setError("");

//   //   const trimmedName = joinMapName.trim();
//   //   const trimmedId = joinMapId.trim();

//   //   if (!trimmedName || !trimmedId) {
//   //     setError("Please provide both the map name and ID.");
//   //     return;
//   //   }

//   //   try {
//   //     const {
//   //       data: { user: authUser },
//   //       error: userError,
//   //     } = await supabase.auth.getUser();

//   //     if (userError || !authUser) {
//   //       setError("You must be logged in to join a map.");
//   //       return;
//   //     }

//   //     const { data, error: mapError } = await supabase
//   //       .from("maps")
//   //       .select("id, name, participants, is_public")
//   //       .eq("id", trimmedId)
//   //       .limit(1);

//   //     console.log("joinMap select result:", { data, mapError });

//   //     if (mapError) {
//   //       console.error("Supabase error when fetching map:", mapError);
//   //       setError("An error occurred while trying to join the map. Please try again.");
//   //       return;
//   //     }

//   //     const mapData = data?.[0] || null;

//   //     if (!mapData) {
//   //       setError("No map found with the provided ID.");
//   //       return;
//   //     }

//   //     if (mapData.name !== trimmedName) {
//   //       setError("The map name does not match the provided ID.");
//   //       return;
//   //     }

//   //     const participants = Array.isArray(mapData.participants)
//   //       ? mapData.participants
//   //       : [];

//   //     if (!participants.includes(authUser.id)) {
//   //       const newParticipants = [...participants, authUser.id];

//   //       const { error: updateError } = await supabase
//   //         .from("maps")
//   //         .update({ participants: newParticipants })
//   //         .eq("id", trimmedId);

//   //       if (updateError) {
//   //         console.error(
//   //           "Supabase error when updating participants:",
//   //           updateError
//   //         );
//   //         setError(
//   //           "An error occurred while trying to join the map. Please try again."
//   //         );
//   //         return;
//   //       }
//   //     }

//   //     setJoinSuccessMessage("You have successfully joined the map.");
//   //     setJoinMapName("");
//   //     setJoinMapId("");
//   //     setIsJoinInputVisible(false);

//   //     // 🔴 HERE: open the joined map in MapEditor
//   //     setSelectedMapId(trimmedId);
//   //   } catch (err) {
//   //     console.error("Unexpected error joining map:", err);
//   //     setError("An error occurred while trying to join the map. Please try again.");
//   //   }
//   // };


//   const handleUsernameChange = async (e) => {
//     const newUsername = e.target.value;
//     setUsername(newUsername);
//     try {
//       const { error } = await supabase
//         .from("users") // ex 'profiles'
//         .update({ username: newUsername })
//         .eq("id", user.id);

//       if (error) throw error;

//       await supabase.auth.updateUser({
//         data: { full_name: newUsername },
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

//   // When a map is selected (created or joined) – show the editor instead of dashboard
//   if (selectedMapId) {
//     return <MapEditor mapId={selectedMapId} />;
//   }

//   return (
//     <div className="dashboard-container">
//       <header className="dashboard-header">
//         <div className="header-left">
//           <div className="user-info">
//             <h2 style={{ color: "#2C5F2D" }}>Hi {username || "User"} ;)</h2>
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
//               <div className="form-group"></div>
//               {error && <p className="error-text">{error}</p>}
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="button-container">
//         {!isCreateInputVisible && (
//           <button
//             className="card-button"
//             onClick={() => setIsCreateInputVisible(true)}
//           >
//             Create New Map
//           </button>
//         )}

//         {!isJoinInputVisible && (
//           <button
//             className="card-button"
//             onClick={() => setIsJoinInputVisible(true)}
//           >
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
//                 <p className="success-text">{joinSuccessMessage}</p>
//               )}
//               {error && <p className="error-text">{error}</p>}
//               <div className="modal-buttons">
//                 <button type="submit" className="card-button">
//                   Join Map
//                 </button>
//                 <button
//                   type="button"
//                   onClick={cancelJoinMap}
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
//             <p>
//               Are you sure you want to delete the "{confirmDelete.mapName}" map?
//             </p>
//             <div className="modal-buttons">
//               <button className="card-button" onClick={confirmDeleteMap}>
//                 Yes
//               </button>
//               <button className="card-button" onClick={cancelDelete}>
//                 No
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <h3 style={{ color: "#2C5F2D" }}>Your Learning Space:</h3>
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
//             <button
//               className="card-button"
//               onClick={() => setSelectedMapId(m.id)}
//             >
//               {m.name || m.id}
//             </button>
//             <button
//               className="delete-button"
//               onClick={() => handleDeleteClick(m.id, m.name)}
//             >
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
