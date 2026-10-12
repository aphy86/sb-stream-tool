import { AppModule } from "../AppModule.js";
import { SocketioServer } from "../components/SocketioServer.js";

export class SocketioServerModule implements AppModule {
  enable(): void {
    SocketioServer.enable();
  }
}

export function createSocketioServer(
  ...args: ConstructorParameters<typeof SocketioServerModule>
) {
  return new SocketioServerModule(...args);
}
