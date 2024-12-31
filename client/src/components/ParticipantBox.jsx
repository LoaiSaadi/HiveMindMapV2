import React, { useEffect, useState } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const ParticipantBox = ({ mapId, currentUserId }) => {
  const [participants, setParticipants] = useState([]);
  const [userDetails, setUserDetails] = useState({});

  useEffect(() => {
    const mapRef = doc(db, "maps", mapId);

    // Fetch participants from the map document
    const unsubscribe = onSnapshot(mapRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const mapData = docSnapshot.data();
        const participantIds = mapData.participants || [];
        setParticipants(
          participantIds.map((id) => ({
            id,
            online: false, // Default all users to offline initially
          }))
        );

        // Fetch user details for each participant
        participantIds.forEach(async (userId) => {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            setUserDetails((prev) => ({
              ...prev,
              [userId]: userDoc.data(),
            }));
          }
        });
      }
    });

    // Emit join-map for the current user
    if (currentUserId) {
      socket.emit("join-map", {
        userId: currentUserId,
        username: userDetails[currentUserId]?.username || "Unknown User",
        mapId,
      });
    }

    // Listen for real-time participant status updates
    socket.on("participant-status", (updatedParticipants) => {
      setParticipants(
        Object.values(updatedParticipants).map((participant) => ({
          ...participant,
          online: participant.online || false,
        }))
      );
    });

    return () => {
      unsubscribe();
      socket.off("participant-status");
    };
  }, [mapId, currentUserId, userDetails]);

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
              <span
                style={{
                  color: participant.online ? "green" : "red",
                  fontWeight: "bold",
                }}
              >
                {participant.online ? "Online" : "Offline"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ParticipantBox;
