import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../firebase";

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);    // true=Login, false=Sign Up
  const [showReset, setShowReset] = useState(false); // מצב להצגת מסך איפוס הסיסמה

  // התחברות עם אימייל וסיסמה
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  // רישום משתמש חדש
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  // איפוס סיסמה
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent!");
      setShowReset(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // אם במצב איפוס סיסמה
  if (showReset) {
    return (
      <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
        <h2>Reset Password</h2>
        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: "10px" }}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "10px" }}
            />
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button type="submit">Send Reset Email</button>
        </form>
        <p>
          <span style={{ color: "blue", cursor: "pointer" }} onClick={() => setShowReset(false)}>
            Back to {isLogin ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h2 style={{ color: "#4CAF50" }}>{isLogin ? "Login" : "Sign Up"}</h2>
      <form onSubmit={isLogin ? handleLogin : handleSignUp}>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", textAlign: "left" }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", margin: "5px 0", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", textAlign: "left" }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", margin: "5px 0", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button
          type="submit"
          style={{ backgroundColor: "#4CAF50", color: "white", padding: "10px 20px", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>

      <p style={{ marginTop: "10px" }}>
        {isLogin ? (
          <>
            Don't have an account?{" "}
            <span
              onClick={() => setIsLogin(false)}
              style={{ color: "#4CAF50", cursor: "pointer", textDecoration: "underline" }}
            >
              Sign Up
            </span>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <span
              onClick={() => setIsLogin(true)}
              style={{ color: "#4CAF50", cursor: "pointer", textDecoration: "underline" }}
            >
              Login
            </span>
          </>
        )}
      </p>

      <p>
        <span onClick={() => setShowReset(true)} style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}>
          Forgot Password?
        </span>
      </p>
    </div>
  );
};

export default LoginPage;
