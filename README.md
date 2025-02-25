# MindMapProject

## Background and Motivation

 This project was developed as part of my studies for my degree at the university of Haifa, under the supervision of Professor Roi Poranne  and Professor Yotam Hod. The goal of MindMapProject is to create an interactive real-time mind mapping tool that enables users to visually organize their thoughts, structure ideas, and collaborate efficiently.

With Firebase's real-time database and Firestore, the project ensures instant updates, allowing multiple users to work on a mind map simultaneously. This project leverages JavaScript and Firebase for a smooth and responsive user experience.


## Project Overview

The MindMapProject provides a real-time collaborative platform where users can create, edit, and manage mind maps dynamically. The system allows multiple users to work together in real time, ensuring an interactive and seamless experience. Users can add descriptions, rename nodes and edges, attach links, and manage access through unique map IDs.

Key functionalities include:

Real-time collaboration: Instant updates with Firebase Realtime Database.  
Access control with unique Map IDs: Ensuring only authorized users can join specific maps.  
User authentication: Secure login and account management.  
Visualization & organization tools: Drag-and-drop node positioning, renaming, linking, and more.  
Live participant tracking: See who is currently working on the mind map.  
Cloud synchronization: Auto-save and retrieval of mind maps from Firebase.  

This tool is designed for students, professionals, and teams who need a structured approach to brainstorming, project planning, and knowledge management.

## Features :

Real-Time Editing : Instant updates with Firebase Realtime Database  

User Registration/Login : Secure authentication with Firebase 

Mind Map Creation : Add, edit, and delete nodes and edges dynamically  

Join a Map with a Unique ID : Users can join an existing mind map by entering its unique map ID 

View Active Participants : Users can see all participants currently working on the map  

Live Presence Updates : Users can see real-time activity when others add, edit, move, or delete nodes  

Drag-and-Drop Nodes : Organize ideas with a smooth UI 

Auto-Save & Cloud Sync : Data is automatically stored in Firebase  

Collaboration Support : Multiple users can work on the same mind map 

Custom Themes : The users can color the edges/nodes in the map and they can choose specific type of edges to connect the nodes, they can custom their maps the way they like   

Unique Map ID System : Every mind map has a unique ID, ensuring that only authorized users can access and edit the map  

Descriptions for Nodes and Maps : Each node can have a detailed description, and the entire map can also have an overview description  

Renaming Nodes and Edges : Users can rename nodes and edges dynamically to refine their mind maps  

Adding Links to Nodes : Each node can include a clickable link to external resources or references  

Profile Page : Displays user information and provides editing options  

Logout and Password Reset : Options for users to log out and reset their passwords  



##  Tech Stack
- React (JavaScript, HTML, CSS) 
- Firebase (Authentication, Firestore, Realtime Database)  
- Development Tools:Visual Studio Code, Git & GitHub  


## Installation and Setup

## Firebase
We used Firebase as our backend, in order to run our project, you need to setup *Firebase*:

1. Go to the Firebase Console and create a new project.
2. In the Project Settings, navigate to the General tab and register your app -> choose Web as the platform.
3. Get Your Firebase Service Account Key:
Navigate to Project Settings,Go to the Service accounts tab-> Click Generate new private key under the Firebase Admin SDK section:
then a JSON file will be downloaded to your computer. 
"we will use this file later ".

Enable Firebase Services:
1. Firebase Authentication is used to manage user sign-ups, logins, and authentication state.<br>
In the Firebase Console, go to the Authentication section and enable the Email/Password sign-in methods.
2. Cloud Firestore:<br>
Go to Firestore Database and Create a new database.
3. Realtime Database:<br>
Go to Realtime Database and click Create Database.<br>
Set the database rules to allow necessary read/write access (public access).

## Run the project:
After you set up Firebase, you can follow these steps to run the project:

1. Clone the Repository: (https://github.com/IsraaBsoul/MindMapProject.git)<br>
Then, open the project and update the Firebase configuration:<br>
   a. Open the file: firebaseConfig -> server\config\firebaseConfig.js, <br>
   and replace the placeholder path with the path to your downloaded JSON file->const serviceAccount = require("path/to/your/firebase-key.json");

   b. Go to the Firebase Console for your project-> navigate to Project Settings-> Scroll down to the "Your apps" section <br>
   then copy your Firebase configuration values, and replace the existing values in the `client\src\firebase.js` file with your own configuration.

2. Install necessary packages for React and Firebase: npm install
3. Navigate to the Project Directory: cd MindMapProject
4. Run the Application:<br>
You should run the server first-> Open a terminal and navigate to the server directory: cd server -> Then start the server: npm start.<br>
Open another terminal and navigate to the client directory: cd client-> Then start the client: npm start.<br>
*DONE :)*
![image](https://github.com/user-attachments/assets/49893958-7f81-4962-babe-63924c6a28e2)

 ![image](https://github.com/user-attachments/assets/24b94d77-3dfc-4a07-b58f-5ca7a96d3cce)





