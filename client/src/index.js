import React from "react";
import ReactDOM from "react-dom/client"; // ייבוא createRoot מ-react-dom
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root")); // שימוש ב-createRoot
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);