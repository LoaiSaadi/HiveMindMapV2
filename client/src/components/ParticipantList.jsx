import React, { useEffect, useState } from "react";
import { db, rtdb } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { ref, onValue, set, onDisconnect } from "firebase/database";

const ParticipantList = ({ mapId, currentUserId }) => {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const participantsRef = collection(db, "maps", mapId, "participants");

    // Fetch participants from Firestore
    const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
      const participantsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setParticipants(participantsData);
    });

    return () => unsubscribe();
  }, [mapId]);

  useEffect(() => {
    if (currentUserId) {
      const statusRef = ref(rtdb, `maps/${mapId}/participants/${currentUserId}/status`);

      // Set online status in Realtime Database
      set(statusRef, "online");
      onDisconnect(statusRef).set("offline");
    }
  }, [mapId, currentUserId]);

  return (
    <div>
      <h3>Participants</h3>
      <ul>
        {participants.map((participant) => (
          <li key={participant.id}>
            {participant.name || "Anonymous"} -{" "}
            <span style={{ color: participant.status === "online" ? "green" : "red" }}>
              {participant.status || "offline"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ParticipantList;
