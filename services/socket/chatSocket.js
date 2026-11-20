import { Server } from "socket.io";
import Message from "../../models/messageModel.js";

export const initSocket = (httpServer) => {
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_chat", ({ userId }) => {
      if (!userId) return;

      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
      }

      socket.join(userId);
      socket.currentRoom = userId;
    });

    
    socket.on("send_message", async ({ userId, senderRole, senderName, message }) => {
      if (!userId || !message?.trim()) return;

      const newMsg = {
        senderRole,
        senderName,
        text: message.trim(),
        createdAt: new Date.now(),
      };

      try {
        await Message.findOneAndUpdate(
          { userId },
          { $push: { messages: newMsg } },
          { upsert: true, returnDocument: 'after' }
        );

        io.to(userId).emit("receive_message", newMsg);

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
