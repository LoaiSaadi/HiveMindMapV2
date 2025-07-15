import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import io from "socket.io-client";


const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);


const socket = io("http://localhost:5000");

const ParticipantBox = ({ mapId, currentUserId }) => {
  const [participants, setParticipants] = useState([]);
  const [userDetails, setUserDetails] = useState({});

  useEffect(() => {
    const fetchMapParticipants = async () => {
      const { data: mapData, error } = await supabase
        .from("maps")
        .select("participants")
        .eq("id", mapId)
        .single();

      if (error || !mapData) {
        console.error("Error fetching map participants:", error);
        return;
      }

      const participantIds = mapData.participants || [];

      setParticipants(
        participantIds.map((id) => ({
          id,
          online: id === currentUserId, // current user is online
        }))
      );

      // Fetch user details
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, username, profile_picture")
        .in("id", participantIds);

      if (usersError) {
        console.error("Error fetching user details:", usersError);
        return;
      }

      const userMap = {};
      users.forEach((user) => {
        userMap[user.id] = user;
      });
      setUserDetails(userMap);

      // Emit join-map after we know the user's username
      const currentUser = userMap[currentUserId];
      if (currentUser) {
        socket.emit("join-map", {
          userId: currentUserId,
          username: currentUser.username || "Unknown User",
          mapId,
        });
      }
    };

    fetchMapParticipants();

    // Listen for real-time participant status updates
    socket.on("participant-status", (updatedParticipants) => {
      setParticipants((prev) =>
        prev.map((participant) => ({
          ...participant,
          online: updatedParticipants[participant.id]?.online || false,
        }))
      );
    });

    return () => {
      socket.off("participant-status");
    };
  }, [mapId, currentUserId]);

  return (
    <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h4>Participants ({participants.length} Total)</h4>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {participants.map((participant) => {
          const user = userDetails[participant.id] || {};
          return (
            <li
              key={participant.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "5px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span>
                {user.username || participant.name || "Unknown User"}
                {participant.id === currentUserId ? " (Me)" : ""}
              </span>
              <img
                src={user.profile_picture || "/default-profile.png"}
                alt={`${user.username || "Unknown User"}'s profile`}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ParticipantBox;






// import React, { useEffect, useState } from "react";
// import { doc, onSnapshot, getDoc } from "firebase/firestore";
// import { db } from "../firebase";
// import io from "socket.io-client";

// const socket = io("http://localhost:5000");

// const ParticipantBox = ({ mapId, currentUserId }) => {
//   const [participants, setParticipants] = useState([]);
//   const [userDetails, setUserDetails] = useState({});

//   useEffect(() => {
//     const mapRef = doc(db, "maps", mapId);

//     // Fetch participants from the map document
//     const unsubscribe = onSnapshot(mapRef, (docSnapshot) => {
//       if (docSnapshot.exists()) {
//         const mapData = docSnapshot.data();
//         const participantIds = mapData.participants || [];
//         setParticipants(
//           participantIds.map((id) => ({
//             id,
//             online: id === currentUserId, // Set current user to online
//           }))
//         );

//         // Fetch user details for each participant
//         participantIds.forEach(async (userId) => {
//           const userDoc = await getDoc(doc(db, "users", userId));
//           if (userDoc.exists()) {
//             setUserDetails((prev) => ({
//               ...prev,
//               [userId]: userDoc.data(),
//             }));
//           }
//         });
//       }
//     });

//     // Emit join-map for the current user
//     if (currentUserId && userDetails[currentUserId]) {
//       socket.emit("join-map", {
//         userId: currentUserId,
//         username: userDetails[currentUserId]?.username || "Unknown User",
//         mapId,
//       });
//     }

//     // Listen for real-time participant status updates
//     socket.on("participant-status", (updatedParticipants) => {
//       setParticipants((prev) =>
//         prev.map((participant) => ({
//           ...participant,
//           online: updatedParticipants[participant.id]?.online || false,
//         }))
//       );
//     });

//     return () => {
//       unsubscribe();
//       socket.off("participant-status");
//     };
//   }, [mapId, currentUserId, userDetails]);

//   return (
//     <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}>
//       <h4>Participants ({participants.length} Total)</h4>
//       <ul style={{ listStyleType: "none", padding: 0 }}>
//         {participants.map((participant) => {
//           const user = userDetails[participant.id] || {};
//           return (
//             <li
//               key={participant.id}
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//                 padding: "5px 0",
//                 borderBottom: "1px solid #eee",
//               }}
//             >
//               <span>
//                 {user.username || participant.name || "Unknown User"}
//                 {participant.id === currentUserId ? " (Me)" : ""}
//               </span>
//               <img
//                 src={user.profilePicture || "/default-profile.png"} // Use Base64 string directly
//                 alt={`${user.username || "Unknown User"}'s profile`}
//                 className="profile-picture"
//                 style={{
//                   width: "50px",
//                   height: "50px",
//                   borderRadius: "50%", // Circular profile pictures
//                   objectFit: "cover", // Ensure aspect ratio is maintained
//                 }}
//               />
//             </li>
//           );
//         })}
//       </ul>
//     </div>
//   );
// };

// export default ParticipantBox;
