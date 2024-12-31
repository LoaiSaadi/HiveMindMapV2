const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

// Add a default route to handle GET requests to the root ("/") URL
app.get("/", (req, res) => {
  res.send("Welcome to the server!"); // This can be any message or a status page
});

app.use("/api", authRoutes);

// Create an HTTP server
const server = http.createServer(app);

// Create a new Socket.IO instance and attach it to the HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (update this in production)
    methods: ["GET", "POST"],
  },
});

// In-memory storage for participants and their status
let participants = {};

// Listen for Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Event: User joins the map
  socket.on("join-map", ({ userId, username, mapId }) => {
    console.log(`${username} (${userId}) joined map ${mapId}`);

    // Add the user to the participants list with their socket ID
    participants[userId] = {
      id: userId,
      name: username,
      online: true,
      mapId,
      socketId: socket.id,
    };

    // Notify all clients about the updated participants list
    io.emit("participant-status", participants);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    // Find the disconnected user by their socket ID
    const disconnectedUser = Object.values(participants).find(
      (participant) => participant.socketId === socket.id
    );

    if (disconnectedUser) {
      console.log(`${disconnectedUser.name} (${disconnectedUser.id}) disconnected`);

      // Mark the user as offline
      participants[disconnectedUser.id].online = false;

      // Notify all clients about the updated participants list
      io.emit("participant-status", participants);
    }
  });
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
