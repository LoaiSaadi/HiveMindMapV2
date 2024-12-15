
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

// Add a default route to handle GET requests to the root ("/") URL
app.get("/", (req, res) => {
  res.send("Welcome to the server!"); // This can be any message or a status page
});


app.use("/api", authRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

