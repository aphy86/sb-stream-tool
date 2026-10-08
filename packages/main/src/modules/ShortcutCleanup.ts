import { AppModule } from "../AppModule.js";
import { ShortcutManager } from "../components/ShortcutManager.js";
import { ModuleContext } from "../ModuleContext.js";

export class ShortcutCleanup implements AppModule {
  enable({ app }: ModuleContext): Promise<void> | void {
    app.on("will-quit", () => ShortcutManager.clear());
  }
}

export function clearShortcutsOnQuit(
  ...args: ConstructorParameters<typeof ShortcutCleanup>
) {
  return new ShortcutCleanup(...args);
}
