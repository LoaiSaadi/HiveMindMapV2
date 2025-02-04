# 🧠 MindMapProject

## Background and Motivation

 This project was developed as part of my studies for my degree at the university of Haifa, under the supervision of Professor Yotam Hod. , under the supervision of Professor Yotam Hod. The goal of **MindMapProject** is to create an **interactive real-time mind mapping tool** that enables users to visually organize their thoughts, structure ideas, and collaborate efficiently.

With **Firebase's real-time database and Firestore**, the project ensures **instant updates**, allowing multiple users to work on a mind map simultaneously. This project leverages **JavaScript and Firebase** for a smooth and responsive user experience.

---
## 📌 Project Overview

The **MindMapProject** provides a **real-time collaborative platform** where users can create, edit, and manage mind maps dynamically. The system allows multiple users to **work together in real time**, ensuring an interactive and seamless experience. Users can **add descriptions, rename nodes and edges, attach links, and manage access through unique map IDs**.

Key functionalities include:

- **Real-time collaboration:** Instant updates with **Firebase Realtime Database**.  
- **Access control with unique Map IDs:** Ensuring only authorized users can join specific maps.  
- **User authentication:** Secure login and account management.  
- **Visualization & organization tools:** Drag-and-drop node positioning, renaming, linking, and more.  
- **Live participant tracking:** See who is currently working on the mind map.  
- **Cloud synchronization:** Auto-save and retrieval of mind maps from Firebase.  

This tool is designed for **students, professionals, and teams** who need a structured approach to brainstorming, project planning, and knowledge management.

## ✅ Features

✔️ **Real-Time Editing** – Instant updates with **Firebase Realtime Database**  

✔️ **User Registration/Login** – Secure authentication with **Firebase**  

✔️ **Mind Map Creation** – Add, edit, and delete **nodes and edges dynamically**  

✔️ **Join a Map with a Unique ID** – Users can join an **existing mind map** by entering its **unique map ID**  

✔️ **View Active Participants** – Users can see **all participants** currently working on the map  

✔️ **Live Presence Updates** – Users can see **real-time activity** when others **add, edit, move, or delete nodes**  

✔️ **Drag-and-Drop Nodes** – Organize ideas with a **smooth UI**  

✔️ **Auto-Save & Cloud Sync** – Data is **automatically stored** in Firebase  

✔️ **Collaboration Support** – Multiple users can **work on the same mind map**  

✔️ **Custom Themes** – Different **visualization styles** to suit various workflows  

✔️ **Unique Map ID System** – Every mind map has a **unique ID**, ensuring that only **authorized users** can access and edit the map  

✔️ **Descriptions for Nodes and Maps** – Each node can have a **detailed description**, and the entire map can also have an **overview description**  

✔️ **Renaming Nodes and Edges** – Users can **rename nodes and edges dynamically** to refine their mind maps  

✔️ **Adding Links to Nodes** – Each node can include a **clickable link** to external resources or references  

✔️ **Profile Page** – Displays **user information** and provides **editing options**  

✔️ **Logout and Password Reset** – Options for users to **log out and reset their passwords**  



Tech Stack:
The project is built using the following technologies:

Frontend: JavaScript, HTML, CSS
Backend: Firebase (Authentication, Firestore, Realtime Database)
Development Tools: Visual Studio Code, Git & GitHub

🚀 Installation and Setup
To run the project locally, follow these steps:

1️⃣ Clone the Repository:

git clone https://github.com/IsraaBsoul/MindMapProject.git

Navigate to the project directory:
cd MindMapProject

2️⃣ Install Dependencies:
Run the following command to install necessary packages:
npm install

3️⃣ Configure Firebase:
Create a Firebase project at Firebase Console
Enable Authentication, Firestore, and Realtime Database
Copy your Firebase configuration and add it to your project in:
/src/firebase-config.js

4️⃣ Run the Application:
Start the development server:
npm start

Then, open your browser and visit:
http://localhost:3000