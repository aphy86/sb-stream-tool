import { AppModule } from "../AppModule.js";
import { ShortcutManager } from "../components/ShortcutManager.js";
import { ModuleContext } from "../ModuleContext.js";

export class ShortcutsModule implements AppModule {
  async enable({ app }: ModuleContext): Promise<void> {
    app.on("will-quit", () => ShortcutManager.clear());
  }
}

export function createShortcutsModule(
  ...args: ConstructorParameters<typeof ShortcutsModule>
) {
  return new ShortcutsModule(...args);
}
