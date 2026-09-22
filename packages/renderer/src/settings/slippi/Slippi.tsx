import { useSettingsStore } from "@renderer/zustand/store";
import FolderBrowser from "./FolderBrowser";
import ConsoleConnection from "./ConsoleConnection";
import { SlippiRelayStatus } from "@app/common";
import {
  RadioGroup,
  RadioGroupItem,
} from "@renderer/components/ui/radio-group";
import { Label } from "@renderer/components/ui/label";

function Slippi() {
  const relayStatus = useSettingsStore((state) => state.slippiRelayStatus);
  const updateRelayStatus = useSettingsStore(
    (state) => state.updateSlippiRelayStatus,
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <h1>Slippi Relay Setup</h1>
      <RadioGroup
        className="flex gap-4 justify-center"
        value={relayStatus}
        onValueChange={(value) => updateRelayStatus(value as SlippiRelayStatus)}
      >
        <div className="flex items-center gap-3">
          <RadioGroupItem value="console" id="r1" />
          <Label htmlFor="r1">Connect via direct Wii connection</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem value="folder" id="r2" />
          <Label htmlFor="r2">Connect via folder</Label>
        </div>
        {/* <div className="flex items-center gap-3">
          <RadioGroupItem value="dolphin" id="r3" />
          <Label htmlFor="r3">Connect via Dolphin connection</Label>
        </div> */}
        <div className="flex items-center gap-3">
          <RadioGroupItem value="disabled" id="r4" />
          <Label htmlFor="r4">Disabled</Label>
        </div>
      </RadioGroup>

      <div className="flex flex-col gap-4 w-full">
        {relayStatus === "folder" && (
          <FolderBrowser disabled={relayStatus !== "folder"} />
        )}
        {relayStatus === "console" && <ConsoleConnection />}
      </div>
    </div>
  );
}

export default Slippi;
