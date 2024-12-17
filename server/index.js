const express = require('express');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // בהמשך כדאי להגביל לדומיין מוגדר
  }
});

// מצב ראשוני של מפה (ניתן לטעון אותו גם מפיירסטור)
let mapState = {
  name: "My Map",
  description: "A collaborative map",
  nodes: [
    { id: "1", data: { label: "Node 1" }, position: { x: 250, y: 5 } },
  ],
  edges: []
};

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // שליחת מצב המפה הנוכחי ללקוח שמתחבר
  socket.emit('mapUpdate', mapState);

  // קבלת עדכון מהלקוח
  socket.on('mapChange', (newMapData) => {
    // כאן אפשר לעדכן את המצב ולשדר לכל השאר
    mapState = { ...mapState, ...newMapData };

    // אופציונלי: לשמור ב-Firestore
    // await updateDoc(doc(db, "maps", mapId), {
    //   ...mapState
    // });

    // שידור לכל המשתמשים המחוברים
    io.emit('mapUpdate', mapState);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});
