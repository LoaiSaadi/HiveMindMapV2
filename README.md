# HiveMindMapV2

## Background and Motivation

This project was developed as part of my studies for my degree at the University of Haifa, under the supervision of Professor Roi Poranne and Professor Yotam Hod.

The goal of **HiveMindMapV2** is to create an interactive, real-time mind mapping tool that enables users to visually organize their thoughts, structure ideas, and collaborate efficiently.

Using Supabase's Realtime Database and Supabase, the application ensures instant updates, allowing multiple users to work on a mind map simultaneously. The project leverages JavaScript and Supabase to deliver a smooth and responsive user experience.

---

## Project Overview

HiveMindMapV2 provides a real-time collaborative platform where users can create, edit, and manage mind maps dynamically.

### Key Functionalities

- Real-time collaboration with Supabase Realtime Database  
- Access control using unique Map IDs  
- Secure user authentication  
- Drag-and-drop node positioning and editing tools  
- Live participant tracking  
- Cloud synchronization with auto-save  

This tool is ideal for students, professionals, and teams for brainstorming, planning, and organizing ideas.

---

## Features

- Real-Time Editing  
- User Authentication (Login & Registration)  
- Dynamic Mind Map Creation (nodes & edges)  
- Join Maps via Unique ID  
- Live Participant Tracking  
- Real-Time Activity Updates  
- Drag-and-Drop Interface  
- Auto-Save & Cloud Sync  
- Multi-user Collaboration  
- Custom Themes (colors & edge styles)  
- Node & Map Descriptions  
- Rename Nodes & Edges  
- Add External Links to Nodes  
- Profile Page  
- Logout & Password Reset  

---

## Tech Stack

- **Frontend:** React (JavaScript, HTML, CSS)  
- **Backend:** Supabase (Authentication, Supabase, Realtime Database)  
- **Tools:** Visual Studio Code, Git, GitHub  

---

## Installation and Setup

After setting up Supabase, follow these steps to run the project.

### 1. Clone the Repository

```bash
git clone https://github.com/LoaiSaadi/HiveMindMapV2.git
cd HiveMindMapV2
```
2. Configure Supabase
Server Configuration

Open the following file:
```bash
server/config/supabaseClient.js
```
Replace the placeholder path with your Supabase Admin SDK key:
```bash
const serviceAccount = require("path/to/your/supabase-key.json");
```
Client Configuration

Go to Supabase Console → Project Settings → Your Apps, then copy your Supabase configuration.

Open the following file:
```bash
client/src/supabase.js
```
Replace the existing configuration with your own Supabase config values.

3. Install Dependencies
```bash
cd server
npm install
cd ../client
npm install
```
4. Run the Application
```bash
cd server
npm start
cd client
npm start
```
5. Open the App
```bash
http://localhost:3000
```
