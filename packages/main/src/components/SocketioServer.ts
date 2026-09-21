import { Server } from "socket.io";
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../types.js";
import { EventStream } from "./EventStream.js";

export class SocketioServer {
  private static server: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(20242, { cors: { origin: "*" } });

  private static sockets: Map<string, number> = new Map();

  // constructor() {
  //   super();
  //   this.server = new Server<
  //     ClientToServerEvents,
  //     ServerToClientEvents,
  //     InterServerEvents,
  //     SocketData
  //   >(20242, { cors: { origin: "*" } });
  //   this.sockets = new Map();
  // }

  static async enable(): Promise<void> {
    this.server.on("connection", (socket) => {
      console.log(`User ${socket.id} connected`);
      this.sockets.set(socket.id, this.sockets.size + 1);

      socket.on("sendDataToServer", (data) => {
        EventStream.notify("toast", "Sending data to overlays");
        socket.broadcast.emit("sendDataToClients", data);
      });

      socket.on("overlayUpdateSuccess", () => {
        EventStream.notify(
          "toast",
          "Connected",
          `Overlay ${this.sockets.get(socket.id)} updated set information successfully!`,
        );
      });

      socket.on("disconnect", () => {
        EventStream.notify(
          "toast",
          "Disconnect",
          `Overlay ${this.sockets.get(socket.id)} disconnected`,
        );
        console.log(`User ${socket.id} disconnected, goodby`);
        this.sockets.delete(socket.id);
      });
    });
  }
}
