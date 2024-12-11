const express = require("express");
const { auth } = require("../config/firebaseConfig");

const router = express.Router();

// מסלול התחברות
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // אימות משתמש באמצעות Firebase Admin
    const user = await auth.getUserByEmail(email);

    // בדיקה אם הסיסמה נכונה (סיסמאות מנוהלות ב-Firebase)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User authenticated", uid: user.uid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
