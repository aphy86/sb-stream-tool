import { send } from "@app/preload";
import { Button } from "../ui/button";
import { SlippiRelayConfig } from "@app/common";
import { useState } from "react";
import { useSettingsStore } from "@renderer/zustand/store";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { sendToastMessage } from "../ui/toast";

function ConsoleConnection() {
  const savedIp = useSettingsStore((state) => state.slippiWiiRelayIp);
  const savedPort = useSettingsStore((state) => state.slippiWiiRelayPort);
  const update = useSettingsStore(
    (state) => state.updateSlippiWiiRelayConnection,
  );
  const write = useSettingsStore(
    (state) => state.writeSlippiRelaySettingsToFile,
  );
  const [ip, setIp] = useState(savedIp);
  const [port, setPort] = useState(savedPort.toString());
  const connectionStatus = useSettingsStore(
    (state) => state.connectionStatuses,
  ).get("slippi-wii");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const portNum = parseInt(port);
        if (!Number.isNaN(portNum)) {
          update(ip, portNum);
          send("slippi-relay/start", {
            type: "console",
            ip: ip,
            port: portNum,
          } as SlippiRelayConfig);
          write({
            wiiIp: ip,
            wiiPort: portNum,
          });
        } else {
          sendToastMessage(
            "Slippi Wii Relay Syntax error",
            "Port is not a number!",
          );
        }
      }}
      className="flex items-center flex-col gap-8 border-t-2 p-4 w-full"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-center font-semibold text-xl">
          Connect to a Wii relay (recommended method)
        </h1>
        <h2 className="text-center">
          Note: You must have launched Slippi Melee in order to connect! (and
          ensure the slippi networking feature is on)
        </h2>
        <h3 className="text-center">Connection Status: {connectionStatus}</h3>
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col gap-1">
          <Label className="pl-0.5 font-semibold ">IP Address</Label>
          <Input value={ip} onChange={(e) => setIp(e.currentTarget.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="pl-0.5 font-semibold">Port</Label>
          <Input
            value={port}
            onChange={(e) => setPort(e.currentTarget.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <Button>Save and Connect</Button>
        <Button type="button">Disconnect</Button>
      </div>
    </form>
  );
}

export default ConsoleConnection;
