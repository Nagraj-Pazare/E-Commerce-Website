import { Server } from "socket.io";
import Message from "../../models/messageModel.js";

export const initSocket = (httpServer) => {
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a customer's private room (and leave previous room if switching)
    socket.on("join_chat", ({ userId }) => {
      if (!userId) return;

      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
      }

      socket.join(userId);
      socket.currentRoom = userId;
    });

    // Save message to MongoDB and broadcast to the room
    socket.on("send_message", async ({ userId, senderRole, senderName, message }) => {
      if (!userId || !message?.trim()) return;

      const newMsg = {
        senderRole,
        senderName,
        text: message.trim(),
        createdAt: new Date(),
      };

      try {
        await Message.findOneAndUpdate(
          { userId },
          { $push: { messages: newMsg } },
          { upsert: true, returnDocument: 'after' }
        );

        // Broadcast live message to everyone in this user's room
        io.to(userId).emit("receive_message", newMsg);

        // Notify admin dashboard if a customer sent the message
        if (senderRole === "user") {
          io.emit("new_customer_alert", {
            userId,
            senderName,
            text: newMsg.text,
          });
        }
      } catch (error) {
        console.error("Socket message error:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};
