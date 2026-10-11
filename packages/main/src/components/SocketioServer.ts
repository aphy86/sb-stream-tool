import { Server } from "socket.io";
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../types.js";
import { Match } from "@app/common";
import { EventStream } from "./EventStream.js";

const PORT = 20242;

export class SocketioServer {
  private static server:
    | Server<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
      >
    | undefined;

  private static sockets = new Map<string, number>();
  private static connectionId = 1;
  private static recentData: Match | undefined;

  static close() {
    this.server?.close();
    this.server = undefined;
    this.sockets.clear();
  }

  private static sendToast(message: string) {
    EventStream.notify("toast", "Overlay", message);
  }

  static enable() {
    if (this.server) {
      return;
    }

    this.server = new Server(PORT, { cors: { origin: "*" } });

    this.server.httpServer.on("error", (error) => {
      console.error(`Socketio server error: ${error}`);
      this.sendToast(`Couldn't start on port ${PORT}: ${error.message}`);
      this.close();
    });

    this.server.on("connection", (socket) => {
      console.log(`User ${socket.id} connected`);
      this.sockets.set(socket.id, this.connectionId);
      this.connectionId++;

      if (this.recentData) {
        socket.emit("sendDataToClients", this.recentData);
      }

      socket.on("sendDataToServer", (data) => {
        this.recentData = data;
        this.sendToast("Sending data to all overlays");
        socket.broadcast.emit("sendDataToClients", data);
      });

      socket.on("overlayUpdateSuccess", () => {
        this.sendToast(
          `Overlay ${this.sockets.get(socket.id)} updated set information successfully!`,
        );
      });

      socket.on("disconnect", () => {
        this.sendToast(`Overlay ${this.sockets.get(socket.id)} disconnected`);
        console.log(`${socket.id} disconnected, goodby`);
        this.sockets.delete(socket.id);
      });
    });
  }
}
