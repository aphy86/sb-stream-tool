import { AppModule } from "../AppModule.js";
import { SettingsStore } from "../components/SettingsStore.js";
import { ModuleContext } from "../ModuleContext.js";

export class SettingsStoreModule implements AppModule {
  enable({ app }: ModuleContext): Promise<void> | void {
    app.on("will-quit", () => SettingsStore.close());
  }
}

export function closeSettingsStore(
  ...args: ConstructorParameters<typeof SettingsStoreModule>
) {
  return new SettingsStoreModule(...args);
}
