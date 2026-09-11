import { MatchDefaultValues, withForm } from "@renderer/utils/form";
import { Button } from "./ui/button";
import Team from "./Team";

const Teams = withForm({
  defaultValues: MatchDefaultValues,
  render: function TeamsScreen({ form }) {
    return (
      <>
        <div className="flex gap-4 justify-center">
          <Button
            type="button"
            onClick={() => {
              form.swapFieldValues("teams", 0, 1);
            }}
          >
            Swap Teams
          </Button>
          <Button
            type="button"
            onClick={() => {
              for (let i = 0; i < form.getFieldValue("teams").length; i++) {
                form.resetField(`teams[${i}].score`);
              }
            }}
          >
            Reset all Scores
          </Button>
        </div>
        <div className="flex gap-1">
          {form.getFieldValue(`teams`).map((_, i) => (
            <Team key={i} form={form} teamNumber={i} />
          ))}
        </div>
      </>
    );
  },
});

export default Teams;
