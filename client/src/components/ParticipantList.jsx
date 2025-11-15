// src/components/ParticipantList.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

const ParticipantList = ({ mapId, currentUserId }) => {
  const [participants, setParticipants] = useState([]);

  // --------------------------------------------------
  // 1. Fetch and subscribe to participants for this map
  // --------------------------------------------------
  useEffect(() => {
    if (!mapId) return;

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
        () => {
          // Whenever participants change in DB → refresh
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapId]);

  // --------------------------------------------------
  // 2. Ensure *this user* has a row in participants
  //    and keep status online/offline
  // --------------------------------------------------
  useEffect(() => {
    if (!currentUserId || !mapId) return;

    const upsertStatus = async (status) => {
      try {
        // Get username from your "users" table
        let username = "Anonymous";
        const { data: userRow, error: userError } = await supabase
          .from("users")
          .select("username")
          .eq("id", currentUserId)
          .single();

        if (!userError && userRow?.username) {
          username = userRow.username;
        }

        const { error } = await supabase
          .from("participants")
          .upsert(
            {
              id: currentUserId,
              map_id: mapId,
              name: username,
              status,
              last_seen: new Date().toISOString(),
            },
            // assumes you created a UNIQUE constraint on (id, map_id)
            { onConflict: "id,map_id" }
          );

        if (error) {
          console.error("Error upserting participant status:", error.message);
        }
      } catch (err) {
        console.error("Unexpected error upserting participant:", err);
      }
    };

    // Mark this user online & create row if missing
    upsertStatus("online");

    const handleBeforeUnload = () => {
      upsertStatus("offline");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      upsertStatus("offline");
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentUserId, mapId]);

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#fff",
      }}
    >
      <h4 style={{ marginBottom: "8px" }}>
        Participants ({participants.length} Total)
      </h4>
      <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
        {participants.map((participant) => (
          <li
            key={participant.id}
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
              {participant.name || "Anonymous"}
              {participant.id === currentUserId ? " (Me)" : ""}
            </span>
            <span
              style={{
                color:
                  participant.status === "online" ? "#2C5F2D" : "#888",
                fontWeight:
                  participant.status === "online" ? "bold" : "normal",
              }}
            >
              {participant.status || "offline"}
            </span>
          </li>
        ))}
        {participants.length === 0 && (
          <li style={{ fontSize: "0.85rem", color: "#777" }}>
            No participants yet.
          </li>
        )}
      </ul>
    </div>
  );
};

export default ParticipantList;
