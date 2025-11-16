require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");
const authRoutes = require("./routes/auth");

const app = express();
app.use(
  cors({
    origin: "*", // ⚠️ tighten in production
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Socket server is running");
});

app.use("/api", authRoutes);

// HTTP + Socket.IO server
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // ⚠️ tighten in production
    methods: ["GET", "POST"],
  },
});

// Supabase admin client (SERVICE ROLE KEY, not anon key!)
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} else {
  console.warn(
    "⚠️ Supabase admin client not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server .env"
  );
}

// In-memory participants per map: { [mapId]: { [userId]: {id, name, status} } }
const participantsByMap = {};

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // // -------- join-map --------
  // socket.on("join-map", async ({ mapId, userId, username }) => {
  //   try {
  //     if (!mapId || !userId) return;

  //     socket.join(mapId);
  //     socket.data.mapId = mapId;
  //     socket.data.userId = userId;

  //     if (!participantsByMap[mapId]) {
  //       participantsByMap[mapId] = {};
  //     }

  //     participantsByMap[mapId][userId] = {
  //       id: userId,
  //       name: username || "Anonymous",
  //       status: "online",
  //     };

  //     // Broadcast participants to this map
  //     io.to(mapId).emit("participants:update", {
  //       mapId,
  //       participants: Object.values(participantsByMap[mapId]),
  //     });

  //     // Persist to Supabase `participants` table
  //     if (supabaseAdmin) {
  //       try {
  //         await supabaseAdmin.from("participants").upsert(
  //           {
  //             id: userId,
  //             map_id: mapId,
  //             name: username || "Anonymous",
  //             status: "online",
  //           },
  //           { onConflict: "id,map_id" }
  //         );
  //       } catch (err) {
  //         console.error("❌ Supabase upsert(participants) failed:", err.message);
  //       }
  //     }

  //     console.log(
  //       `👤 ${username || "Anonymous"} (${userId}) joined map ${mapId}`
  //     );
  //   } catch (err) {
  //     console.error("join-map error:", err.message);
  //   }
  // });

  // -------- join-map --------
  socket.on("join-map", async ({ mapId, userId, username }) => {
    console.log("SERVER join-map received:", { mapId, userId, username });
    try {
      if (!mapId || !userId) return;

      socket.join(mapId);
      socket.data.mapId = mapId;
      socket.data.userId = userId;

      if (!participantsByMap[mapId]) {
        participantsByMap[mapId] = {};
      }

      participantsByMap[mapId][userId] = {
        id: userId,
        name: username || "Anonymous",
        status: "online",
      };

      // Broadcast participants in memory
      io.to(mapId).emit("participants:update", {
        mapId,
        participants: Object.values(participantsByMap[mapId]),
      });

      // Persist in Supabase
      if (supabaseAdmin) {
        try {
          // 1) upsert into participants table
          await supabaseAdmin
            .from("participants")
            .upsert(
              {
                id: userId,
                map_id: mapId,
                name: username || "Anonymous",
                status: "online",
              },
              { onConflict: "id,map_id" }
            );

          // 2) also ensure userId exists in maps.participants
          const { data: mapRow, error: mapError } = await supabaseAdmin
            .from("maps")
            .select("participants")
            .eq("id", mapId)
            .single();

          if (mapError) {
            console.error(
              "join-map: error fetching map participants:",
              mapError.message
            );
          } else {
            let current = [];

            if (Array.isArray(mapRow.participants)) {
              current = [...mapRow.participants];
            } else if (typeof mapRow.participants === "string") {
              // defensive, if somehow stored as JSON string
              try {
                const parsed = JSON.parse(mapRow.participants);
                if (Array.isArray(parsed)) current = parsed;
              } catch {
                /* ignore */
              }
            }

            if (!current.includes(userId)) {
              const updatedParticipants = [...current, userId];

              const { error: mapUpdateError } = await supabaseAdmin
                .from("maps")
                .update({ participants: updatedParticipants })
                .eq("id", mapId);

              if (mapUpdateError) {
                console.error(
                  "join-map: failed updating maps.participants:",
                  mapUpdateError.message
                );
              } else {
                console.log(
                  "join-map: maps.participants updated:",
                  updatedParticipants
                );
              }
            }
          }
        } catch (err) {
          console.error("❌ Supabase upsert/update in join-map failed:", err);
        }
      }

      console.log(
        `👤 ${username || "Anonymous"} (${userId}) joined map ${mapId}`
      );
    } catch (err) {
      console.error("join-map error:", err.message);
    }
  });


  // -------- cursor:move --------
  socket.on("cursor:move", ({ mapId, userId, x, y, username, color }) => {
    if (!mapId || !userId) return;
    // Broadcast to everyone in room (including sender)
    io.to(mapId).emit("cursor:update", {
      mapId,
      userId,
      x,
      y,
      username,
      color,
    });
  });

  // -------- map:update (nodes/edges/etc) --------
  socket.on("map:update", ({ mapId, ...rest }) => {
    if (!mapId) return;
    // Send to others in same room
    socket.to(mapId).emit("map:updated", {
      mapId,
      ...rest,
    });
  });

  // -------- disconnect --------
  socket.on("disconnect", async () => {
    const { mapId, userId } = socket.data || {};
    console.log("🔌 Socket disconnected:", socket.id, mapId, userId);

    if (mapId && userId && participantsByMap[mapId]) {
      if (participantsByMap[mapId][userId]) {
        participantsByMap[mapId][userId].status = "offline";
      }

      io.to(mapId).emit("participants:update", {
        mapId,
        participants: Object.values(participantsByMap[mapId]),
      });

      if (supabaseAdmin) {
        try {
          await supabaseAdmin
            .from("participants")
            .update({ status: "offline" })
            .eq("id", userId)
            .eq("map_id", mapId);
        } catch (err) {
          console.error(
            "❌ Supabase update(participants.status=offline) failed:",
            err.message
          );
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
