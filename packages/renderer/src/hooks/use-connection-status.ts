import { onConnectionStatusChange } from "@app/preload";
import { useSettingsStore } from "@renderer/zustand/store";
import { useEffect } from "react";

export function useConnectionStatus() {
  const updateStatus = useSettingsStore(
    (state) => state.updateConnectionStatus,
  );

  useEffect(() => {
    onConnectionStatusChange((type, status) => {
      updateStatus(type, status);
    });
  }, []);
}
