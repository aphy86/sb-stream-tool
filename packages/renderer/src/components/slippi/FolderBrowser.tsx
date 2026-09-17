import { useSettingsStore } from "@renderer/zustand/store";
import { Button } from "../ui/button";
import { send } from "@app/preload";
import { useHydratedState } from "@renderer/hooks/use-hydrated-state";
import { SlippiRelayConfig } from "@app/common";

function FolderBrowser({ disabled }: { disabled: boolean }) {
  const savedDirectory = useSettingsStore(
    (state) => state.slippiRelayDirectory,
  );
  const update = useSettingsStore((state) => state.updateSlippiRelayDirectory);
  const write = useSettingsStore(
    (state) => state.writeSlippiRelaySettingsToFile,
  );
  const [directory, setDirectory] = useHydratedState(savedDirectory);

  const connectionStatus = useSettingsStore(
    (state) => state.connectionStatuses,
  ).get("slippi-folder");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        update(directory);
        send("slippi-relay/start", {
          type: "folder",
          listenPath: directory,
        } as SlippiRelayConfig).catch((reason) => console.log(reason));
        write({
          directory: directory,
        });
      }}
      className="flex items-center flex-col gap-4 border-t-2 p-4 w-full"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-center font-semibold text-xl">
          Connect to relay manually
        </h1>
        <h2 className="text-center">
          Note: This option is for those who are connecting to the console via
          Slippi Launcher, etc
        </h2>
        <h3>Connection status: {connectionStatus}</h3>
      </div>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-center font-semibold">Select target folder:</h1>
          <div className="flex gap-4 items-center justify-center ">
            <Button
              type="button"
              disabled={disabled}
              onClick={() => {
                send("file:openDialog")
                  .then((directory) => setDirectory(directory as string))
                  .catch((reason) => console.log(reason));
              }}
            >
              Browse
            </Button>
            <h1>{directory === "" ? "No directory selected." : directory}</h1>
          </div>
        </div>
        <div className="flex gap-2 w-full justify-center">
          <Button disabled={disabled}>Save and start reading</Button>
          <Button
            type="button"
            onClick={() => {
              send("slippi-relay/stop").catch((error) => console.log(error));
            }}
            disabled={disabled}
          >
            Stop
          </Button>
        </div>
      </div>
    </form>
  );
}

export default FolderBrowser;
