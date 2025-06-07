import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  transports: ["websocket"], // đảm bảo ổn định
  autoConnect: false // chỉ kết nối sau khi login
});

export default socket;
