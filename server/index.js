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

  socket.on("join-map", async ({ mapId, userId, username }) => {
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

      // broadcast in-memory participants
      io.to(mapId).emit("participants:update", {
        mapId,
        participants: Object.values(participantsByMap[mapId]),
      });

      // --- Persist to Supabase: participants table + maps.participants ---
      if (!supabaseAdmin) {
        console.warn(
          "⚠️ supabaseAdmin not configured – maps.participants won't be updated"
        );
      } else {
        // 1) optional: participants table
        try {
          await supabaseAdmin.from("participants").upsert(
            {
              id: userId,
              map_id: mapId,
              name: username || "Anonymous",
              status: "online",
            },
            { onConflict: "id,map_id" }
          );
        } catch (err) {
          console.error(
            "❌ Supabase upsert(participants) failed:",
            err.message
          );
        }

        // 2) update maps.participants array
        try {
          const { data: mapRow, error: mapError } = await supabaseAdmin
            .from("maps")
            .select("participants")
            .eq("id", mapId)
            .single();

          if (mapError) {
            console.error(
              "❌ Error fetching map for participants:",
              mapError.message
            );
          } else {
            const current = Array.isArray(mapRow?.participants)
              ? mapRow.participants
              : [];

            if (!current.includes(userId)) {
              const updated = [...current, userId];

              const { error: updateError } = await supabaseAdmin
                .from("maps")
                .update({ participants: updated })
                .eq("id", mapId);

              if (updateError) {
                console.error(
                  "❌ Error updating maps.participants:",
                  updateError.message
                );
              } else {
                console.log("✅ maps.participants updated to:", updated);
              }
            } else {
              console.log("ℹ️ user already in maps.participants");
            }
          }
        } catch (err) {
          console.error("❌ Supabase admin error in join-map:", err.message);
        }
      }

      console.log(`👤 ${username || "Anonymous"} (${userId}) joined map ${mapId}`);
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
