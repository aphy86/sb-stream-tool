import { useFieldArray, useFormContext } from "react-hook-form";
import { Tournament } from "@app/common";
import { useTeam } from "@renderer/hooks/use-team";
import { useSettingsStore } from "@renderer/zustand/store";
import { Button } from "./ui/button";
import Team from "./Team";
import { resetAllScores } from "@renderer/utils/helpers";

function Teams() {
  const { getValues, setValue } = useFormContext<Tournament>();
  const { swapGameInfo } = useTeam(); // react-hook-form's gameInfo state
  const { fields, swap } = useFieldArray<Tournament>({ name: "teams" });
  const swapCharacters = useSettingsStore((state) => state.swapCharacters); // zustands character state, gathered from slippi (may not be needed soon)
  // const players = usePlayerFormFieldArrayContext();
  return (
    <>
      <div className="flex gap-4 justify-center">
        <Button
          type="button"
          className="w-1/5"
          onClick={() => {
            swap(0, 1);
            swapCharacters(0, 1); // since it's not synced with react-hook-form, it needs to be called
          }}
        >
          Swap Teams
        </Button>
        <Button
          type="button"
          className="w-1/5"
          onClick={() => {
            swapGameInfo(0, 1);
            swapCharacters(0, 1); // since it's not synced with react-hook-form, it needs to be called
          }}
        >
          Swap characters
        </Button>
        <Button
          type="button"
          className="w-1/5"
          onClick={() => {
            resetAllScores(getValues, setValue);
          }}
        >
          Reset all scores
        </Button>
      </div>
      <div className="flex gap-1">
        {fields.map((team, teamNum) => (
          <Team key={team.id} teamNum={teamNum} />
        ))}
      </div>
    </>
  );
}

export default Teams;
