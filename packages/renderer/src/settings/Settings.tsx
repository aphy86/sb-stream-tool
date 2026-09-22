import { useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar";
import SettingsSidebar from "./SettingsSidebar";
import { Button } from "../components/ui/button";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useSettingsStore } from "@renderer/zustand/store";

function Settings({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const homeHotkey = useSettingsStore(
    (state) => state.shortcuts.get("home") ?? "Escape",
  );

  useHotkey(homeHotkey, () => navigate("~"));

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex gap-2 w-full">
        <SettingsSidebar />
        <div className="w-full">
          <div className="flex justify-between items-center p-4 ">
            <SidebarTrigger type="button" />
            <Button type="button" onClick={() => navigate("~")}>
              <X />
            </Button>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default Settings;
