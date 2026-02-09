const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

const routes = require("./routers/routes");
const chatRoutes = require("./routers/chatRoutes");
const messageRoutes = require("./routers/messageRoutes");
const Message = require("./models/messageModel");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({ origin: FRONTEND_URL,
   credentials: true }));

app.use(express.json());

mongoose.connect(MONGO_URI).then(() =>
   console.log("MongoDB connected")).catch((err) =>
 {
    console.error(err);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.send("QuickChat Backend Running");
});

app.use("/api/user", routes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("setup", (userData) => {
    if (!userData || !userData._id) return;
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", async (newMessageRecieved) => {
    try {
      const populatedMessage = await Message.findById(newMessageRecieved._id)
        .populate("sender", "name username email pic")
        .populate("chat");

      if (!populatedMessage?.chat?.users) return;

      populatedMessage.chat.users.forEach((user) => {
        if (user._id.toString() === populatedMessage.sender._id.toString()) return;
        socket.in(user._id.toString()).emit("message recieved", populatedMessage);
      });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("disconnect", () => {});
});

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
