import { useFieldArray, useFormContext } from "react-hook-form";
import { Tournament } from "@app/common";
import { useTeam } from "@renderer/hooks/use-team";
import { Button } from "./ui/button";
import Team from "./Team";
import { resetAllScores } from "@renderer/utils/helpers";

function Teams() {
  const { getValues, setValue } = useFormContext<Tournament>();
  const { swapGameInfo } = useTeam(); // react-hook-form's gameInfo state, for specifically gameInfo swapping
  const { fields, swap } = useFieldArray<Tournament>({ name: "teams" });
  return (
    <>
      <div className="flex gap-4 justify-center">
        <Button
          type="button"
          className="w-1/5"
          onClick={() => {
            swap(0, 1);
          }}
        >
          Swap Teams
        </Button>
        <Button
          type="button"
          className="w-1/5"
          onClick={() => {
            swapGameInfo(0, 1);
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
