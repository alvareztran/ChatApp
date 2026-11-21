import { io } from "socket.io-client";

let socket = null;
let currentToken = null;

export const initSocket = (token) => {
  if (!token) return null;

  if (socket && currentToken === token) {
    if (socket.connected) return socket;

    socket.connect();
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

  socket = io(socketUrl, {
    auth: { token },
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = null;
};
