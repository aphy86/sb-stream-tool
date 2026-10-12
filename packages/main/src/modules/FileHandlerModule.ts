import { AppModule } from "../AppModule.js";
import { FileHandler } from "../components/FileHandler.js";

export class FileHandlerModule implements AppModule {
  enable(): void {
    FileHandler.createDirs().catch((error) =>
      console.error(`Failed to create output folders: ${error}`),
    );
  }
}

export function createFileHandler(
  ...args: ConstructorParameters<typeof FileHandlerModule>
) {
  return new FileHandlerModule(...args);
}
