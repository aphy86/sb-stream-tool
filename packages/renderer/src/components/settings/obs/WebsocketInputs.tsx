import { useSettingsStore } from "../../../zustand/store";
import { send } from "@app/preload";
import { Label } from "@renderer/components/ui/label";
import { Input } from "@renderer/components/ui/input";
import { Button } from "@renderer/components/ui/button";
import { useHydratedState } from "@renderer/hooks/use-hydrated-state";
// import { useObsWebsocketStatus } from "@renderer/hooks/use-obs-websocket-status";
// import {
//   Dialog,
//   DialogContent,
//   DialogTrigger,
// } from "@renderer/components/ui/dialog";

function WebsocketInputs() {
  const savedIp = useSettingsStore((state) => state.websocketIp);
  const savedPort = useSettingsStore((state) => state.websocketPort);
  const savedPassword = useSettingsStore((state) => state.websocketPassword);
  const update = useSettingsStore((state) => state.updateWebsocketSettings);

  const [ip, setIp] = useHydratedState(savedIp);
  const [port, setPort] = useHydratedState(savedPort);
  const [password, setPassword] = useHydratedState(savedPassword);

  // const { obsWebsocketStatus } = useObsWebsocketStatus();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const websocketIp = ip.trim();
        const websocketPort = port.trim();
        const websocketPassword = password.trim();

        update(websocketIp, websocketPort, websocketPassword);

        send(
          "obs/connect",
          websocketIp,
          websocketPort,
          websocketPassword,
        ).catch((error) => console.log(error));
      }}
    >
      <div className="flex flex-col gap-3">
        <h1 className="text-center font-semibold text-xl">
          Connect to the OBS Websocket
        </h1>
        {/* <h2 className="text-center">Status: {obsWebsocketStatus}</h2> */}
        {/* {obsWebsocketStatus === "disconnected" && (
          <p className="text-center">
            In order to use the automated scene switch, you must connect to OBS.{" "}
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="link">
                  Need help connecting?
                </Button>
              </DialogTrigger>
              <DialogContent>
                To connect to OBS, launch OBS Studio:
                <ol className="ml-6 list-decimal space-y-2">
                  <li>
                    On the top bar, go to Tools &gt; WebSocket Server Settings
                  </li>
                  <li>Make sure "Enable WebSocket server" is checked</li>
                  <li>
                    Click on "Show Connect Info" and click yes for anything that
                    pops up
                  </li>
                  <li>
                    Paste in the connect information onto the tool, then click
                    connect
                  </li>
                  <li>You're done!</li>
                </ol>
              </DialogContent>
            </Dialog>
          </p>
        )} */}

        <div className="flex flex-col gap-2">
          <Label>IP Address</Label>
          <Input
            placeholder="127.0.0.1"
            value={ip}
            onChange={(e) => setIp(e.currentTarget.value)}
          ></Input>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Port</Label>
          <Input
            type="number"
            placeholder="4455"
            value={port}
            onChange={(e) => setPort(e.currentTarget.value)}
          ></Input>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          ></Input>
        </div>
        <Button>Connect</Button>
        <Button
          type="button"
          onClick={() => {
            send("obs/disconnect");
          }}
        >
          Disconnect
        </Button>
      </div>
    </form>
  );
}
export default WebsocketInputs;
