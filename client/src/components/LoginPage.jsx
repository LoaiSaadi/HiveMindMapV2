import React, { useState, useEffect } from "react";
import { supabase } from "../supabase"; // import your Supabase client
import io from "socket.io-client";

// Set up the Socket.IO connection to the server
const socket = io("http://localhost:5000");

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);

  const defaultProfilePicture = "https://example.com/default-profile-picture.png";

  useEffect(() => {
    socket.on("map_updated", (data) => {
      console.log("Map updated:", data);
    });
    return () => {
      socket.off("map_updated");
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result); // Base64
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please upload a valid image file.");
    }
  };

  const handleSwitchMode = (mode) => {
    setError("");
    setIsLogin(mode);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
      console.log("trying to log in ", data)
      if (loginError) throw loginError;

      socket.emit("user_logged_in", { email: data.user.email });
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  //   // Login with email and password
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     console.log("Attempting login with email:", email);
//     setError("");
//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       console.log("Login successful:", userCredential);
//       // After successful login, emit a real-time login event (optional)
//       socket.emit("user_logged_in", { email: userCredential.user.email });
//       onLogin();
//     } catch (err) {
//       console.log("Login error:", err);
//       setError(err.message);
//     }
//   };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      const user = data.user;
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: user.id,
          email: user.email,
          username,
          profile_picture: profilePicture || defaultProfilePicture,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      alert("A confirmation email has been sent. Please verify your email.");
      socket.emit("user_logged_in", { email: user.email });
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) return setError("Please enter your email.");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;
      alert("Password reset email sent!");
      setShowReset(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // UI remains mostly the same...
  if (showReset) {
    return (
      <div style={styles.container}>
        <h2 style={styles.heading}>Reset Password</h2>
        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: "20px" }}>
            <label style={styles.label}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          {error && <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}
          <button type="submit" className="card-button">Send Reset Email</button>
        </form>
        <p style={{ marginTop: "15px", fontSize: "0.9rem" }}>
          <span style={styles.link} onClick={() => setShowReset(false)}>
            Back to {isLogin ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div style={styles.main}>
      <h1 style={styles.title}>Welcome to the Learning Space</h1>
      <h2 style={styles.heading}>{isLogin ? "Login" : "Sign Up"}</h2>
      <form onSubmit={isLogin ? handleLogin : handleSignUp}>
        {!isLogin ? (
          <>
            <Input label="Username" value={username} onChange={setUsername} />
            <Input label="Email" value={email} onChange={setEmail} />
            <Input label="Password" type="password" value={password} onChange={setPassword} />
            <div style={{ marginBottom: "10px" }}>
              <label style={styles.label}>Profile Picture:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={styles.input}
              />
            </div>
          </>
        ) : (
          <>
            <Input label="Email" value={email} onChange={setEmail} />
            <Input label="Password" type="password" value={password} onChange={setPassword} />
          </>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" className="card-button">
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>

      <p style={{ marginTop: "10px", fontSize: "14px" }}>
        {isLogin ? (
          <>
            Don't have an account?{" "}
            <span onClick={() => handleSwitchMode(false)} style={styles.link}>
              Sign Up
            </span>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <span onClick={() => handleSwitchMode(true)} style={styles.link}>
              Login
            </span>
          </>
        )}
      </p>
      <p style={{ fontSize: "14px" }}>
        <span onClick={() => setShowReset(true)} style={styles.link}>
          Forgot Password?
        </span>
      </p>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text" }) => (
  <div style={{ marginBottom: "10px" }}>
    <label style={styles.label}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      style={styles.input}
    />
  </div>
);

const styles = {
  main: {
    background: "linear-gradient(to right,#d9fdd3, rgb(206, 240, 164))",
    maxWidth: "650px",
    margin: "50px auto",
    textAlign: "center",
    padding: "40px 20px",
    border: "2px solid #4CAF50",
    borderRadius: "15px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    textAlign: "center",
    background: "linear-gradient(to right, #A8E063,rgb(166, 214, 144))",
    padding: "30px",
    borderRadius: "15px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
    fontFamily: "'Poppins', sans-serif"
  },
  title: {
    fontSize: "2.5rem",
    color: "#2C5F2D",
    marginBottom: "20px",
    fontFamily: "'Poppins', sans-serif"
  },
  heading: { color: "#2C5F2D" },
  label: {
    display: "block",
    textAlign: "left",
    fontWeight: "bold",
    marginBottom: "5px",
    color: "#2C5F2D"
  },
  input: {
    width: "95%",
    padding: "10px",
    margin: "5px 0",
    border: "1px solid #ccc",
    borderRadius: "5px",
    color: "#2C5F2D"
  },
  link: {
    color: "#2C5F2D",
    cursor: "pointer",
    textDecoration: "underline"
  }
};

export default LoginPage;





// import React, { useState, useEffect } from "react";
// import {
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   sendPasswordResetEmail,
//   sendEmailVerification
// } from "firebase/auth";
// import { auth } from "../firebase";
// import io from "socket.io-client";
// import { doc, setDoc, getDoc } from "firebase/firestore";
// import { db } from "../firebase";

// // Set up the Socket.IO connection to the server
// const socket = io("http://localhost:5000");

// const LoginPage = ({ onLogin }) => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [isLogin, setIsLogin] = useState(true); // true=Login, false=Sign Up
//   const [showReset, setShowReset] = useState(false); // State for password reset screen
//   const [username, setUsername] = useState("");
//   const [profilePicture, setProfilePicture] = useState(null);

//   const defaultProfilePicture = "https://example.com/default-profile-picture.png";

//   // Setup socket connection once the component mounts
//   useEffect(() => {
//     // Listen for real-time map updates from other users
//     socket.on("map_updated", (data) => {
//       console.log("Map updated:", data);
//       // You can update the state here with the new map data or apply changes
//     });

//     // Cleanup when the component unmounts
//     return () => {
//       socket.off("map_updated");
//     };
//   }, []);

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file && file.type.startsWith("image/")) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         const base64String = reader.result; // This contains the Base64 string
//         setProfilePicture(base64String); // Save to state
//       };
//       reader.readAsDataURL(file);
//     } else {
//       setError("Please upload a valid image file.");
//     }
//   };

//   const handleSwitchMode = (mode) => {
//     setError(""); // Clear error when switching modes
//     setIsLogin(mode);
//   };

//   // Login with email and password
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     console.log("Attempting login with email:", email);
//     setError("");
//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       console.log("Login successful:", userCredential);
//       // After successful login, emit a real-time login event (optional)
//       socket.emit("user_logged_in", { email: userCredential.user.email });
//       onLogin();
//     } catch (err) {
//       console.log("Login error:", err);
//       setError(err.message);
//     }
//   };

//   // Sign up a new user
//   const handleSignUp = async (e) => {
//     e.preventDefault();
//     console.log("Attempting sign up with email:", email);
//     setError("");
//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       console.log("Sign up successful:", userCredential);
//       const user = userCredential.user;
//       const userData = {
//         email: user.email,
//         username: username,
//         profilePicture: profilePicture || defaultProfilePicture, // Save Base64 string
//         uid: user.uid,
//         createdAt: new Date().toISOString(),
//       };
//       await setDoc(doc(db, "users", user.uid), userData);
//       try {
//         await sendEmailVerification(user);
//         alert("A verification email has been sent. Please verify your email.");
//       } catch (verificationError) {
//         setError("Failed to send verification email. Please try again later.");
//       }
//       socket.emit("user_logged_in", { email: user.email });

//       onLogin();
//     } catch (err) {
//       console.log("Sign up error:", err);
//       setError(err.message);
//     }
//   };

//   // Reset password
//   const handleResetPassword = async (e) => {
//     e.preventDefault();
//     console.log("Resetting password for email:", email);
//     setError("");
//     if (!email) {
//       setError("Please enter your email to reset password.");
//       return;
//     }
//     try {
//       await sendPasswordResetEmail(auth, email);
//       console.log("Password reset email sent to:", email);
//       alert("Password reset email sent!");
//       setShowReset(false);
//     } catch (err) {
//       console.log("Password reset error:", err);
//       setError(err.message);
//     }
//   };

//   const fetchUserData = async (userId) => {
//     const docRef = doc(db, "users", userId);
//     const docSnap = await getDoc(docRef);

//     if (docSnap.exists()) {
//       const userData = docSnap.data();
//       setUsername(userData.username);
//       setProfilePicture(userData.profilePicture); // Base64 string
//     } else {
//       console.log("No such document!");
//     }
//   };

//   // If in password reset mode
//   if (showReset) {
//     return (
//       <div style={{
//         maxWidth: "400px",
//         margin: "50px auto",
//         textAlign: "center",
//         background: "linear-gradient(to right, #A8E063,rgb(166, 214, 144))",
//         padding: "30px",
//         borderRadius: "15px",
//         boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
//         fontFamily: "'Poppins', sans-serif"
//       }}>
//         <h2 style={{ color: "#2C5F2D", marginBottom: "20px", fontSize: "1.8rem" }}>Reset Password</h2>
//         <form onSubmit={handleResetPassword}>
//           <div style={{ marginBottom: "20px" }}>
//             <label style={{ fontWeight: "bold", marginBottom: "10px", display: "block", color: "#2C5F2D" }}>Email:</label>
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//               style={{
//                 color: "#2C5F2D",
//                 width: "80%",
//                 padding: "12px",
//                 borderRadius: "8px",
//                 border: "1px solid #ccc",
//                 boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
//               }}
//             />
//           </div>
//           {error && <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}
//           <button
//             type="submit"
//             className="card-button"
//             // onMouseOver={(e) => e.target.style.backgroundColor = "#45A049"}
//             // onMouseOut={(e) => e.target.style.backgroundColor = "#4CAF50"}
//           >
//             Send Reset Email
//           </button>
//         </form>
//         <p style={{ marginTop: "15px", fontSize: "0.9rem" }}>
//           <span
//             style={{ color: "#4CAF50", cursor: "pointer", textDecoration: "underline" }}
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
//         background: "linear-gradient(to right,#d9fdd3, rgb(206, 240, 164))",
//         maxWidth: "650px",
//         margin: "50px auto",
//         textAlign: "center",
//         padding: "40px 20px",
//         border: "2px solid #4CAF50", // Add green border
//         borderRadius: "15px",
//         boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
//       }}
//     >
//        {/* Add the welcome label */}
//        <h1 style={{ fontSize: "2.5rem", color: "#2C5F2D", marginBottom: "20px", fontFamily: "'Poppins', sans-serif" }}>
//         Welcome to the Learning Space
//       </h1>
//       <h2 style={{ color: "#2C5F2D" }}>{isLogin ? "Login" : "Sign Up"}</h2>
//       <form onSubmit ={isLogin ? handleLogin : handleSignUp}>
//         {isLogin && (
//           <>
//             <div style={{ marginBottom: "20px" }}>
//               <label style={{ display: "block", textAlign: "left", fontWeight: "bold", color: "#2C5F2D" }}>Email:</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 style={{ width: "95%", padding: "10px", margin: "10px 0", border: "1px solid #ccc", borderRadius: "5px" }}
//               />
//             </div>
//             <div style={{ marginBottom: "20px" }}>
//               <label style={{ display: "block", textAlign: "left", fontWeight: "bold" , color: "#2C5F2D"}}>Password:</label>
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 style={{ width: "95%", padding: "10px", margin: "10px 0", border: "1px solid #ccc", borderRadius: "5px" }}
//               />
//             </div>
//           </>
//         )}
//         {!isLogin && (
//           <>
//             <div style={{ marginBottom: "10px" }}>
//               <label style={{ display: "block", textAlign: "left", fontWeight: "bold" ,color: "#2C5F2D"}}>Username:</label>
//               <input
//                 type="text"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 required
//                 style={{ width: "95%", padding: "10px", margin: "5px 0", border: "1px solid #ccc", borderRadius: "5px",color: "#2C5F2D" }}
//               />
//             </div>
//             <div style={{ marginBottom: "10px" }}>
//               <label style={{ display: "block", textAlign: "left", fontWeight: "bold" ,color: "#2C5F2D"}}>Email:</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => {
//                   console.log("Email input changed:", e.target.value);
//                   setEmail(e.target.value);
//                 }}
//                 required
//                 style={{ width: "95%", padding: "10px", margin: "5px 0", border: "1px solid #ccc", borderRadius: "5px" }}
//               />
//             </div>
//             <div style={{ marginBottom: "5px" }}>
//               <label style={{ display: "block", textAlign: "left", fontWeight: "bold" , color: "#2C5F2D"}}>Password:</label>
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 style={{ width: "95%", padding: "10px", margin: "5px 0", border: "1px solid #ccc", borderRadius: "5px" , color: "#2C5F2D"}}
//               />
//             </div>
//             <div style={{ marginBottom: "10px" }}>
//               <label style={{ display: "block", textAlign: "left", fontWeight: "bold", color: "#2C5F2D" }}>Profile Picture:</label>
//               <input
//                 type="file"
//                 accept="image/*"
//                 onChange={handleFileChange}
//                 style={{ width: "95%", padding: "10px", margin: "5px 0", border: "1px solid #ccc", borderRadius: "5px" }}
//               />
//             </div>
//           </>
//         )}
//         {error && <p style={{ color: "red" }}>{error}</p>}
//         <button
//           type="submit"
//           className="card-button"
//           // onMouseOver={(e) => e.target.style.backgroundColor = "#45A049"}
//           // onMouseOut={(e) => e.target.style.backgroundColor = "#4CAF50"}
//         >
//           {isLogin ? "Login" : "Sign Up"}
//         </button>
//       </form>

//       <p style={{ marginTop: "10px", fontSize: "14px" }}>
//         {isLogin ? (
//           <>
//             Don't have an account?{" "}
//             <span
//               onClick={() => handleSwitchMode(false)}
//               style={{ color: "#2C5F2D", cursor: "pointer", textDecoration: "underline" }}
//             >
//               Sign Up
//             </span>
//           </>
//         ) : (
//           <>
//             Already have an account?{" "}
//             <span
//               onClick={() => handleSwitchMode(true)}
//               style={{ color: "#4CAF50", cursor: "pointer", textDecoration: "underline" ,color: "#2C5F2D"}}
//             >
//               Login
//             </span>
//           </>
//         )}
//       </p>

//       <p style={{ fontSize: "14px" }}>
//         <span
//           onClick={() => setShowReset(true)}
//           style={{ color: "#2C5F2D", cursor: "pointer", textDecoration: "underline" }}
//         >
//           Forgot Password?
//         </span>
//       </p>
      
//     </div>
//   );
// };

// export default LoginPage;
