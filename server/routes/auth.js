const express = require("express");
const supabase = require("../config/supabaseClient");  // <-- imported here

const router = express.Router();

// Optional: verify JWT from client requests
const verifyUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ message: "Invalid token", error });

  req.user = data.user;
  next();
};

// Example protected route
router.get("/profile", verifyUser, async (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;


// const express = require("express");
// const { auth } = require("../config/firebaseConfig");

// const router = express.Router();

// // מסלול התחברות
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // אימות משתמש באמצעות Firebase Admin
//     const user = await auth.getUserByEmail(email);

//     // בדיקה אם הסיסמה נכונה (סיסמאות מנוהלות ב-Firebase)
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({ message: "User authenticated", uid: user.uid });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// module.exports = router;
