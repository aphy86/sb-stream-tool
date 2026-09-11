import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { Label } from "@renderer/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select";
import { Spinbox } from "@renderer/components/ui/spinbox";
import { useHydratedState } from "@renderer/hooks/use-hydrated-state";
import { ObsScene } from "@renderer/zustand/slices/obsScenesSlice";
import { useSettingsStore } from "@renderer/zustand/store";
import { useState } from "react";

function Scenes() {
  const savedGameStartScenes = useSettingsStore(
    (state) => state.gameStartScenes,
  );
  const savedGameEndScenes = useSettingsStore((state) => state.gameEndScenes);
  const savedSetEndScenes = useSettingsStore((state) => state.setEndScenes);
  const update = useSettingsStore((state) => state.updateScenes);

  const [newSceneInput, setNewSceneInput] = useState({
    scene: "",
    start: 0,
    where: "game-start",
  });

  const [gameStartScenes, setGameStartScenes] =
    useHydratedState<ObsScene[]>(savedGameStartScenes);
  const [gameEndScenes, setGameEndScenes] =
    useHydratedState<ObsScene[]>(savedGameEndScenes);
  const [setEndScenes, setSetEndScenes] =
    useHydratedState<ObsScene[]>(savedSetEndScenes);

  return (
    <div className="flex flex-col gap-2 pb-1">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          switch (newSceneInput.where) {
            case "game-start":
              setGameStartScenes([
                ...gameStartScenes,
                {
                  scene: newSceneInput.scene.trim(),
                  start: newSceneInput.start,
                },
              ]);
              break;
            case "game-end":
              setGameEndScenes([
                ...gameEndScenes,
                {
                  scene: newSceneInput.scene.trim(),
                  start: newSceneInput.start,
                },
              ]);
              break;
            case "set-end":
              setSetEndScenes([
                ...setEndScenes,
                {
                  scene: newSceneInput.scene.trim(),
                  start: newSceneInput.start,
                },
              ]);
              break;
            default:
              console.log("error");
          }
        }}
      >
        <h1 className="text-center font-semibold text-xl">Add Scene</h1>
        <div>
          <Label className="pb-1">Scene Name</Label>
          <Input
            value={newSceneInput.scene}
            onChange={(e) =>
              setNewSceneInput({
                ...newSceneInput,
                scene: e.currentTarget.value,
              })
            }
            type="text"
            placeholder="Scene Name"
          />
        </div>
        <div className="flex gap-4 w-full items-center">
          <div className="w-full">
            <Label className="pb-1">Switch to scene in milliseconds</Label>
            <Spinbox
              value={newSceneInput.start}
              onValueChange={(n) =>
                setNewSceneInput({
                  ...newSceneInput,
                  start: n,
                })
              }
              placeholder="Switch in milliseconds"
            />
          </div>
          <div className="w-full">
            <Label className="pb-1">Switch to scene when</Label>
            <Select
              value={newSceneInput.where}
              onValueChange={(v) =>
                setNewSceneInput({
                  ...newSceneInput,
                  where: v,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="game-start">Game Starts</SelectItem>
                <SelectItem value="game-end">Game Ends</SelectItem>
                <SelectItem value="set-end">Set Ends</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="w-full">Add Scene</Button>
      </form>
      <Button
        type="button"
        onClick={() => {
          update(gameStartScenes, gameEndScenes, setEndScenes);
        }}
      >
        Update all scenes
      </Button>
      <div className="flex flex-col gap-4">
        <div className="border-b-2 border-gray-400"></div>
        <h2 className="text-center">
          When a game starts, play the following scenes:
        </h2>
        <div className="flex flex-col gap-4">
          {gameStartScenes.map((scene, index) => (
            <div
              className="flex justify-between"
              key={`game-start-scene-${scene.scene}-${scene.start}`}
            >
              <h5>
                In {scene.start} milliseconds, switch to scene {scene.scene}
              </h5>
              <Button
                className="ml-4"
                onClick={() =>
                  setGameStartScenes(
                    gameStartScenes.filter(
                      (_, deletionIndex) => index !== deletionIndex,
                    ),
                  )
                }
              >
                Delete Scene
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="border-b-2 border-gray-400"></div>
        <h2 className="text-center">
          When a game ends, play the following scenes:
        </h2>
        <div className="flex flex-col gap-4">
          {gameEndScenes.map((scene, index) => (
            <div
              className="flex justify-between"
              key={`game-end-scene-${scene.scene}-${scene.start}`}
            >
              <h5>
                In {scene.start} milliseconds, switch to scene {scene.scene}
              </h5>
              <Button
                className="ml-4"
                onClick={() =>
                  setGameEndScenes(
                    gameEndScenes.filter(
                      (_, deletionIndex) => index !== deletionIndex,
                    ),
                  )
                }
              >
                Delete Scene
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="border-b-2 border-gray-400"></div>
        <h2 className="text-center">
          When a set ends, play the following scenes:
        </h2>
        <div className="flex flex-col gap-4">
          {setEndScenes.map((scene, index) => (
            <div
              className="flex justify-between"
              key={`set-end-scene-${scene.scene}-${scene.start}`}
            >
              <h5>
                In {scene.start} milliseconds, switch to scene {scene.scene}
              </h5>
              <Button
                className="ml-4"
                onClick={() =>
                  setSetEndScenes(
                    setEndScenes.filter(
                      (_, deletionIndex) => index !== deletionIndex,
                    ),
                  )
                }
              >
                Delete Scene
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="border-b-2 border-gray-400"></div>
    </div>
  );
}

export default Scenes;
