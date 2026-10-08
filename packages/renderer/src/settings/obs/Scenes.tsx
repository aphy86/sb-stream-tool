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
import {
  ALL_OBS_SCENE_TYPES,
  ObsScene,
  ObsSceneSettings,
  ObsSceneType,
} from "@app/common";
import { useSettingsStore } from "@renderer/zustand/store";
import { memo, useCallback, useState } from "react";

const LABELS: Record<ObsSceneType, { option: string; heading: string }> = {
  "game-start": {
    option: "Game Starts",
    heading: "When a game starts, play the following scenes:",
  },
  "game-end": {
    option: "Game Ends",
    heading: "When a game ends, play the following scenes:",
  },
  "set-end": {
    option: "Set Ends",
    heading: "When a set ends, play the following scenes:",
  },
};

const SceneGroup = memo(function SceneGroup({
  type,
  scenes,
  onRemove,
}: {
  type: ObsSceneType;
  scenes: ObsScene[];
  onRemove: (type: ObsSceneType, index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="border-b-2 border-gray-400"></div>
      <h2 className="text-center">{LABELS[type].heading}</h2>
      <div className="flex flex-col gap-4">
        {scenes.map((scene, index) => (
          <div className="flex justify-between" key={index}>
            <h5>
              In {scene.start} milliseconds, switch to scene {scene.scene}
            </h5>
            <Button className="ml-4" onClick={() => onRemove(type, index)}>
              Delete Scene
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
});

function Scenes() {
  const saved = useSettingsStore((state) => state.scenes);
  const update = useSettingsStore((state) => state.updateScenes);

  const [draft, setDraft] = useState<ObsSceneSettings | null>(null);
  const scenes = draft ?? saved;

  const [input, setInput] = useState<{
    scene: string;
    start: number;
    type: ObsSceneType;
  }>({
    scene: "",
    start: 0,
    type: "game-start",
  });

  const addScene = () =>
    setDraft((d) => {
      const current = d ?? saved;
      return {
        ...current,
        [input.type]: [
          ...current[input.type],
          { scene: input.scene.trim(), start: input.start },
        ],
      };
    });

  const removeScene = useCallback(
    (type: ObsSceneType, index: number) =>
      setDraft((d) => {
        const current = d ?? saved;
        return {
          ...current,
          [type]: current[type].filter((_, i) => i !== index),
        };
      }),
    [saved],
  );

  const save = () =>
    update(scenes)
      .then(() => setDraft(null))
      .catch(console.error);

  return (
    <div className="flex flex-col gap-2 pb-1">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          addScene();
        }}
      >
        <h1 className="text-center font-semibold text-xl">Add Scene</h1>
        <div>
          <Label className="pb-1">Scene Name</Label>
          <Input
            value={input.scene}
            onChange={(e) =>
              setInput({ ...input, scene: e.currentTarget.value })
            }
            type="text"
            placeholder="Scene Name"
          />
        </div>
        <div className="flex gap-4 w-full items-center">
          <div className="w-full">
            <Label className="pb-1">Switch to scene in milliseconds</Label>
            <Spinbox
              value={input.start}
              min={0}
              onValueChange={(n) => setInput({ ...input, start: n })}
              placeholder="Switch in milliseconds"
            />
          </div>
          <div className="w-full">
            <Label className="pb-1">Switch to scene when</Label>
            <Select
              value={input.type}
              onValueChange={(v) =>
                setInput({ ...input, type: v as ObsSceneType })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_OBS_SCENE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {LABELS[type].option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="w-full">Add Scene</Button>
      </form>

      <Button type="button" onClick={save} disabled={draft === null}>
        Update all scenes
      </Button>
      {draft !== null && (
        <p className="text-center">Scene changes are not saved.</p>
      )}

      {ALL_OBS_SCENE_TYPES.map((type) => (
        <SceneGroup
          key={type}
          type={type}
          scenes={scenes[type]}
          onRemove={removeScene}
        />
      ))}
      <div className="border-b-2 border-gray-400"></div>
    </div>
  );
}

export default Scenes;
