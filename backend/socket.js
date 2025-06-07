// socket.js
const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:8080", // 🔁 địa chỉ FE
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("👥 New user connected:", socket.id);

    // Khi client gửi tin nhắn
    socket.on("privateMessage", ({ from, to, message }) => {
      console.log(`💬 ${from} gửi tới ${to}: ${message}`);

      // Gửi lại cho người nhận (dùng socketId nếu bạn có map userId -> socketId)
      io.emit("receiveMessage", { from, to, message });
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });
}

module.exports = { initSocket };

