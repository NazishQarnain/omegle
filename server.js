const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let waitingUser = null;

// Serve static files from the "public" folder
app.use(express.static("public"));

// Handle socket connections
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Match users or put them in a waiting queue
    if (waitingUser) {
        io.to(socket.id).emit("chat-started", { peer: waitingUser });
        io.to(waitingUser).emit("chat-started", { peer: socket.id });
        waitingUser = null;
    } else {
        waitingUser = socket.id;
    }

    // Handle messages
    socket.on("message", ({ to, message }) => {
        io.to(to).emit("message", { from: socket.id, message });
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        if (waitingUser === socket.id) {
            waitingUser = null;
        }
        io.emit("peer-disconnected", socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
