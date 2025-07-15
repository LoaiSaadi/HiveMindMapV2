import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ParticipantList = ({ mapId, currentUserId }) => {
  const [participants, setParticipants] = useState([]);

  // Fetch participants for this map
  useEffect(() => {
    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("id, name, status")
        .eq("map_id", mapId);

      if (error) {
        console.error("Error fetching participants:", error.message);
      } else {
        setParticipants(data || []);
      }
    };

    fetchParticipants();

    // Optional: subscribe to changes
    const channel = supabase
      .channel(`map-participants-${mapId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `map_id=eq.${mapId}`,
        },
        (payload) => {
          // Refresh list on any insert/update/delete
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapId]);

  // Set status = online on mount, offline on disconnect
  useEffect(() => {
    if (!currentUserId || !mapId) return;

    const setStatus = async (status) => {
      await supabase
        .from("participants")
        .update({ status })
        .eq("id", currentUserId)
        .eq("map_id", mapId);
    };

    setStatus("online");

    const handleBeforeUnload = () => {
      setStatus("offline");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      setStatus("offline");
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentUserId, mapId]);

  return (
    <div>
      <h3>Participants</h3>
      <ul>
        {participants.map((participant) => (
          <li key={participant.id}>
            {participant.name || "Anonymous"} -{" "}
            <span
              style={{
                color: participant.status === "online" ? "green" : "red",
              }}
            >
              {participant.status || "offline"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ParticipantList;










// import React, { useEffect, useState } from "react";
// import { db, rtdb } from "../firebase";
// import { collection, onSnapshot } from "firebase/firestore";
// import { ref, onValue, set, onDisconnect } from "firebase/database";

// const ParticipantList = ({ mapId, currentUserId }) => {
//   const [participants, setParticipants] = useState([]);

//   useEffect(() => {
//     const participantsRef = collection(db, "maps", mapId, "participants");

//     // Fetch participants from Firestore
//     const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
//       const participantsData = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));
//       setParticipants(participantsData);
//     });

//     return () => unsubscribe();
//   }, [mapId]);

//   useEffect(() => {
//     if (currentUserId) {
//       const statusRef = ref(rtdb, `maps/${mapId}/participants/${currentUserId}/status`);

//       // Set online status in Realtime Database
//       set(statusRef, "online");
//       onDisconnect(statusRef).set("offline");
//     }
//   }, [mapId, currentUserId]);

//   return (
//     <div>
//       <h3>Participants</h3>
//       <ul>
//         {participants.map((participant) => (
//           <li key={participant.id}>
//             {participant.name || "Anonymous"} -{" "}
//             <span style={{ color: participant.status === "online" ? "green" : "red" }}>
//               {participant.status || "offline"}
//             </span>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default ParticipantList;
