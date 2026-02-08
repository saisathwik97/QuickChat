const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const routes = require("./routers/routes");
const chatRoutes = require("./routers/chatRoutes");
const messageRoutes = require("./routers/messageRoutes");
const Message = require("./models/messageModel"); // Add this import

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MONGO_URI is not set. Add MONGO_URI to your .env file.");
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Error connecting to MongoDB:", err));

app.get("/", (req, res) => {
  res.send("Welcome to QuickChat Backend!");
});

app.use("/api/user", routes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const io = require('socket.io')(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  }
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("setup", (userData) => {
    if (!userData || !userData._id) {
      console.log("setup called without user data");
      return;
    }
    socket.join(userData._id);
    console.log("User joined room:", userData._id);
    socket.emit("connected");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined chat room:", room);
  });

  socket.on("new message", async (newMessageRecieved) => {
    try {
      var chat = newMessageRecieved.chat;
      
      if (!chat.users) {
        console.log("chat.users not defined");
        return;
      }

      // Populate the sender and chat details before emitting
      const populatedMessage = await Message.findById(newMessageRecieved._id)
        .populate("sender", "name username email pic")
        .populate("chat");

      if (!populatedMessage) {
        console.log("Message not found");
        return;
      }

      chat.users.forEach((user) => {
        if (user._id === newMessageRecieved.sender._id) return;
        socket.in(user._id).emit("message recieved", populatedMessage);
      });
    } catch (error) {
      console.error("Error in new message handler:", error);
    }
  });

  socket.on("setup", () => {
    console.log("USER DISCONNECTED");
    
  });
});