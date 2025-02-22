@echo off
echo Starting the server...
cd server
start cmd /k "npm install && npm start"

echo Starting the client...
cd ../client
start cmd /k "npm install && npm start"

echo App is running!
exit
