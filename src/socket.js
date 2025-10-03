import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:8080";

// Determine if the current connection is from the admin
const isAdmin = window.location.pathname.includes("Admin");

const socket = io(SOCKET_URL, {
  autoConnect: true,
  query: {
    isAdmin: isAdmin.toString(), // Pass isAdmin=true for admin connections
  },
});

export default socket;
