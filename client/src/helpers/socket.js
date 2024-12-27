import { io } from "socket.io-client";

class SocketManager {
  socket = null;
  BASE_URL = "http://localhost:50136";

  connectSocket() {
    if (this.socket?.connected) return; 

    this.socket = io(this.BASE_URL);

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  }

  disconnectSocket() {
    if (this.socket?.connected) {
      this.socket.disconnect();
      console.log("Socket disconnected manually");
    }
  }
}

export default new SocketManager();
