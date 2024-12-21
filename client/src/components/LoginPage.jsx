
// import React, { useState } from "react";
// import {
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   sendPasswordResetEmail
// } from "firebase/auth";
// import { auth } from "../firebase";

// const LoginPage = ({ onLogin }) => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [isLogin, setIsLogin] = useState(true); // true=Login, false=Sign Up
//   const [showReset, setShowReset] = useState(false); // מצב להצגת מסך איפוס הסיסמה

//   // התחברות עם אימייל וסיסמה
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     console.log("Attempting login with email:", email); // Log email for debugging
//     setError("");
//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       console.log("Login successful:", userCredential); // Log successful login response
//       onLogin();
//     } catch (err) {
//       console.log("Login error:", err); // Log the error
//       setError(err.message);
//     }
//   };

//   // רישום משתמש חדש
//   const handleSignUp = async (e) => {
//     e.preventDefault();
//     console.log("Attempting sign up with email:", email); // Log email for debugging
//     setError("");
//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       console.log("Sign up successful:", userCredential); // Log successful signup response
//       onLogin();
//     } catch (err) {
//       console.log("Sign up error:", err); // Log the error
//       setError(err.message);
//     }
//   };

//   // איפוס סיסמה
//   const handleResetPassword = async (e) => {
//     e.preventDefault();
//     console.log("Resetting password for email:", email); // Log email for debugging
//     setError("");
//     if (!email) {
//       setError("Please enter your email to reset password.");
//       return;
//     }
//     try {
//       await sendPasswordResetEmail(auth, email);
//       console.log("Password reset email sent to:", email); // Log when the email is sent
//       alert("Password reset email sent!");
//       setShowReset(false);
//     } catch (err) {
//       console.log("Password reset error:", err); // Log the error
//       setError(err.message);
//     }
//   };

//   // If in password reset mode
//   if (showReset) {
//     return (
//       <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
//         <h2>Reset Password</h2>
//         <form onSubmit={handleResetPassword}>
//           <div style={{ marginBottom: "10px" }}>
//             <label>Email:</label>
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//               style={{ width: "100%", padding: "10px" }}
//             />
//           </div>
//           {error && <p style={{ color: "red" }}>{error}</p>}
//           <button type="submit">Send Reset Email</button>
//         </form>
//         <p>
//           <span
//             style={{ color: "blue", cursor: "pointer" }}
//             onClick={() => setShowReset(false)}
//           >
//             Back to {isLogin ? "Login" : "Sign Up"}
//           </span>
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div
//       style={{
//         maxWidth: "400px",
//         margin: "50px auto",
//         textAlign: "center",
//         padding: "20px",
//         border: "1px solid #ddd",
//         borderRadius: "8px"
//       }}
//     >
//       <h2 style={{ color: "#4CAF50" }}>{isLogin ? "Login" : "Sign Up"}</h2>
//       <form onSubmit={isLogin ? handleLogin : handleSignUp}>
//         <div style={{ marginBottom: "10px" }}>
//           <label style={{ display: "block", textAlign: "left" }}>Email:</label>
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => {
//               console.log("Email input changed:", e.target.value); // Log the email input change
//               setEmail(e.target.value);
//             }}
//             required
//             style={{ width: "100%", padding: "10px", margin: "5px 0", border: "1px solid #ccc", borderRadius: "4px" }}
//           />
//         </div>
//         <div style={{ marginBottom: "10px" }}>
//           <label style={{ display: "block", textAlign: "left" }}>Password:</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => {
//               console.log("Password input changed:", e.target.value); // Log the password input change
//               setPassword(e.target.value);
//             }}
//             required
//             style={{ width: "100%", padding: "10px", margin: "5px 0", border: "1px solid #ccc", borderRadius: "4px" }}
//           />
//         </div>
//         {error && <p style={{ color: "red" }}>{error}</p>}
//         <button
//           type="submit"
//           style={{
//             backgroundColor: "#4CAF50",
//             color: "white",
//             padding: "10px 20px",
//             border: "none",
//             borderRadius: "4px",
//             cursor: "pointer"
//           }}
//         >
//           {isLogin ? "Login" : "Sign Up"}
//         </button>
//       </form>

//       <p style={{ marginTop: "10px" }}>
//         {isLogin ? (
//           <>
//             Don't have an account?{" "}
//             <span
//               onClick={() => setIsLogin(false)}
//               style={{ color: "#4CAF50", cursor: "pointer", textDecoration: "underline" }}
//             >
//               Sign Up
//             </span>
//           </>
//         ) : (
//           <>
//             Already have an account?{" "}
//             <span
//               onClick={() => setIsLogin(true)}
//               style={{ color: "#4CAF50", cursor: "pointer", textDecoration: "underline" }}
//             >
//               Login
//             </span>
//           </>
//         )}
//       </p>

//       <p>
//         <span
//           onClick={() => setShowReset(true)}
//           style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
//         >
//           Forgot Password?
//         </span>
//       </p>
//     </div>
//   );
// };

// export default LoginPage;
import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../firebase";
import io from "socket.io-client";


// Set up the Socket.IO connection to the server
const socket = io("http://localhost:5000");

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true); // true=Login, false=Sign Up
  const [showReset, setShowReset] = useState(false); // State for password reset screen

  // Setup socket connection once the component mounts
  useEffect(() => {
    // Listen for real-time map updates from other users
    socket.on("map_updated", (data) => {
      console.log("Map updated:", data);
      // You can update the state here with the new map data or apply changes
    });

    // Cleanup when the component unmounts
    return () => {
      socket.off("map_updated");
    };
  }, []);

  // Login with email and password
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Attempting login with email:", email);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful:", userCredential);
      // After successful login, emit a real-time login event (optional)
      socket.emit("user_logged_in", { email: userCredential.user.email });
      onLogin();
    } catch (err) {
      console.log("Login error:", err);
      setError(err.message);
    }
  };

  // Sign up a new user
  const handleSignUp = async (e) => {
    e.preventDefault();
    console.log("Attempting sign up with email:", email);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Sign up successful:", userCredential);
      // After successful signup, emit a real-time login event (optional)
      socket.emit("user_logged_in", { email: userCredential.user.email });
      onLogin();
    } catch (err) {
      console.log("Sign up error:", err);
      setError(err.message);
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    console.log("Resetting password for email:", email);
    setError("");
    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent to:", email);
      alert("Password reset email sent!");
      setShowReset(false);
    } catch (err) {
      console.log("Password reset error:", err);
      setError(err.message);
    }
  };

  // If in password reset mode
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
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={() => setShowReset(false)}
          >
            Back to {isLogin ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "50px auto",
        textAlign: "center",
        padding: "20px",
       
        border: "2px solid #4CAF50", // Add green border
        borderRadius: "8px"
      }}
    >
      <h2 style={{ color: "#4CAF50" }}>{isLogin ? "Login" : "Sign Up"}</h2>
      <form onSubmit={isLogin ? handleLogin : handleSignUp}>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", textAlign: "left" }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              console.log("Email input changed:", e.target.value);
              setEmail(e.target.value);
            }}
            required
            style={{ width: "100%", padding: "9px", margin: "5px 0", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", textAlign: "left" }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              console.log("Password input changed:", e.target.value);
              setPassword(e.target.value);
            }}
            required
            style={{ width: "100%", padding: "9px", margin: "5px 0", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button
          type="submit"
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "9px 20px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
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
        <span
          onClick={() => setShowReset(true)}
          style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
        >
          Forgot Password?
        </span>
      </p>

      <div>
        <div className="tenor-gif-embed" 
            data-postid="10521569059124562392" 
            data-share-method="host" 
            data-aspect-ratio="1.2" 
            data-width="100%"
            style={{ width: '50px', height: '50px', display: 'inline-block' }} >
            <a href="https://tenor.com/view/milk-and-mocha-gif-10521569059124562392" >
                Milk And Mocha Sticker
            </a>
            from 
            <a href="https://tenor.com/search/milk+and+mocha-stickers">Milk And Mocha Stickers</a>
        </div>
        <script type="text/javascript" async src="https://tenor.com/embed.js"></script>
      </div>
    
    </div>
  );
};

export default LoginPage;
