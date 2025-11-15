import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

/**
 * Shows the participants for a given map based on the `participants` array
 * on the `maps` table, and joins that with `users.username`.
 */
const ParticipantBox = ({ mapId, currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchParticipants = async () => {
    if (!mapId) return;

    try {
      setLoading(true);

      // 1. Get participants array from the maps table
      const { data: mapRow, error: mapError } = await supabase
        .from("maps")
        .select("participants")
        .eq("id", mapId)
        .single();

      if (mapError) {
        console.error("Error fetching map participants:", mapError);
        setUsers([]);
        return;
      }

      const participantIds = Array.isArray(mapRow?.participants)
        ? mapRow.participants
        : [];

      if (participantIds.length === 0) {
        setUsers([]);
        return;
      }

      // 2. Get usernames for those IDs from users table
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username")
        .in("id", participantIds);

      if (usersError) {
        console.error("Error fetching user details:", usersError);
        setUsers([]);
        return;
      }

      // keep the order roughly by the array, so creator appears first
      const userMap = new Map(usersData.map((u) => [u.id, u]));
      const ordered = participantIds
        .map((id) => userMap.get(id))
        .filter(Boolean);

      setUsers(ordered);
    } catch (err) {
      console.error("Unexpected error in fetchParticipants:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapId) return;

    // initial load
    fetchParticipants();

    // realtime: whenever the maps row for this map changes, re-fetch participants
    const channel = supabase
      .channel(`map-participants-${mapId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "maps",
          filter: `id=eq.${mapId}`,
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  const total = users.length;

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        background: "#ffffff",
      }}
    >
      <h4 style={{ margin: "0 0 8px 0" }}>
        Participants ({total} Total)
      </h4>

      {loading ? (
        <p style={{ fontSize: "0.9rem" }}>Loading...</p>
      ) : total === 0 ? (
        <p style={{ fontSize: "0.9rem" }}>No participants yet.</p>
      ) : (
        <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
          {users.map((u) => (
            <li
              key={u.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 0",
                borderBottom: "1px solid #eee",
                fontSize: "0.9rem",
              }}
            >
              <span>
                {u.username || "Unknown user"}
                {u.id === currentUserId ? " (You)" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ParticipantBox;




// // src/components/ParticipantBox.jsx
// import React, { useEffect, useState } from "react";
// import { supabase } from "../supabase";

// /**
//  * Shows the participants for a given map.
//  *
//  * We DON'T read the map row here anymore. Instead, MapEditor passes us
//  * the participantIds it already has from the `maps` table.
//  */
// const ParticipantBox = ({ mapId, currentUserId, participantIds }) => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const ids = Array.isArray(participantIds) ? participantIds : [];

//     if (!mapId || ids.length === 0) {
//       setUsers([]);
//       setLoading(false);
//       return;
//     }

//     const fetchUsers = async () => {
//       try {
//         setLoading(true);

//         const { data, error } = await supabase
//           .from("users")
//           .select("id, username")
//           .in("id", ids);

//         if (error) {
//           console.error("Error fetching participant usernames:", error);
//           setUsers([]);
//           return;
//         }

//         // keep order according to ids array
//         const byId = new Map((data || []).map((u) => [u.id, u]));
//         const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

//         setUsers(ordered);
//       } catch (err) {
//         console.error("Unexpected error in ParticipantBox:", err);
//         setUsers([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [mapId, JSON.stringify(participantIds)]);

//   const total = users.length;

//   return (
//     <div
//       style={{
//         marginTop: "20px",
//         padding: "10px",
//         border: "1px solid #ddd",
//         borderRadius: "8px",
//         background: "#ffffff",
//       }}
//     >
//       <h4 style={{ margin: "0 0 8px 0" }}>
//         Participants ({total} Total)
//       </h4>

//       {loading ? (
//         <p style={{ fontSize: "0.9rem" }}>Loading...</p>
//       ) : total === 0 ? (
//         <p style={{ fontSize: "0.9rem" }}>No participants yet.</p>
//       ) : (
//         <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
//           {users.map((u) => (
//             <li
//               key={u.id}
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//                 padding: "4px 0",
//                 borderBottom: "1px solid #eee",
//                 fontSize: "0.9rem",
//               }}
//             >
//               <span>
//                 {u.username || "Unknown user"}
//                 {u.id === currentUserId ? " (You)" : ""}
//               </span>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default ParticipantBox;
