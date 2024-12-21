
// const express = require("express");
// const cors = require("cors");

// const authRoutes = require("./routes/auth");

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Add a default route to handle GET requests to the root ("/") URL
// app.get("/", (req, res) => {
//   res.send("Welcome to the server!"); // This can be any message or a status page
// });


// app.use("/api", authRoutes);

// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io"); // Import Socket.IO Server
const http = require("http"); // Import HTTP module to create a server
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

// Listen for Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Example event: Listen for 'message' events from clients
  socket.on("message", (data) => {
    console.log("Message received:", data);

    // Broadcast the message to all connected clients
    io.emit("message", data);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
