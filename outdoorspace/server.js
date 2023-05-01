const express = require("express");
const app = express();

app.use(express.static("public"));

const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server);

server.listen(80, () => {
  console.log("Server started on port 80");
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("user-connected", (username) => {
    socket.username = username;
    socket.broadcast.emit("user-connected", username);
  });

  // Handle new messages from the client
  socket.on("send-chat-message", (message) => {
    console.log(`Received message: ${message}`);
    socket.broadcast.emit("newMessage", { username: socket.username, message });
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      socket.broadcast.emit("user-disconnected", socket.username);
    }
  });
});
