// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server,{cors:{
        origins:"*",
        method:"GET",
        allowedHeaders:true,
        credentials:true
    }});

// Serve the static files from the "public" folder
app.use(express.static("public"));
let allUsers = [];
let waitingList = [];
let chatList = [];
// Listen for client connections
io.on("connection", (socket) => {
    allUsers.push(socket);
    console.log("A client connected:", socket.id);
    // Listen for messages from the client
    io.emit("g", allUsers.length);
    socket.on("message", (data) => {
        const index1 = chatList.findIndex(chat => chat.first.socket.id === socket.id);
        const index2 = chatList.findIndex(chat => chat.second.socket.id === socket.id);
        const time = new Date().getHours()+" : "+new Date().getMinutes();
        if(index1 !== -1){
            chatList.at(index1).first.socket.emit("reply",[socket.id,data,time])
            chatList.at(index1).second.socket.emit("reply",[socket.id,data,time])
        }
        if(index2 !== -1){
            chatList.at(index2).first.socket.emit("reply",[socket.id,data,time])
            chatList.at(index2).second.socket.emit("reply",[socket.id,data,time])
        }
    });
    socket.on("connectToChat", (data) => {
            console.log("connecttochat")
        const i = waitingList.findIndex(chat => chat.socket === socket);
        const index = chatList.findIndex(chat => chat.first.id === socket.id);
        const index2 = chatList.findIndex(chat => chat.second.id === socket.id);
        if (i === -1 && index === -1 && index2 === -1) {
            waitingList.push({socket:socket,name:data});
            socket.emit("connectedTo","you are in waiting list")
            console.log(socket.id + " waiting");
        } else {
            console.log("you are already in waiting or you are already connected");
            socket.emit("warn", "already you are in waiting list");
        }
        if (waitingList.length >= 2) {
            console.log(
                waitingList.at(0).name + " connected to " + waitingList.at(1).name
            );
            chatList.push({first:waitingList.at(0),second: waitingList.at(1)});
            waitingList.at(0).socket.emit("connectedTo", waitingList.at(0).name + " connected to " + waitingList.at(1).name);
            waitingList.at(1).socket.emit("connectedTo", waitingList.at(1).name + " connected to " + waitingList.at(0).name);
            waitingList.splice(0, 2);
        }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        
        const index = allUsers.indexOf(socket);
        const waitingListIndex = waitingList.findIndex(chat => chat.socket === socket);
        const index1 = chatList.findIndex(chat => chat.first.socket.id === socket.id);
        const index2 = chatList.findIndex(chat => chat.second.socket.id === socket.id);
        console.log(index1)
        console.log(index2)
        if (index !== -1) {
            allUsers.splice(index, 1);
        }
        if (waitingListIndex !== -1){
            waitingList.splice(waitingListIndex, 1);
        }
        if(index1 !== -1){
            chatList.at(index1).second.socket.emit("connectedTo", "disconnected");
            chatList.splice(index1, 1);
        }
        if(index2 !== -1){
            chatList.at(index2).first.socket.emit("connectedTo", "disconnected");
            chatList.splice(index2, 1);
        }
            io.emit("g", allUsers.length);
        console.log("Client disconnected:", socket.id);
    });
});
// setInterval(() => {
//     io.emit("g", allUsers.length);
// }, 1000);
// Start the server on port 3000
server.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
});




