import { MatchDefaultValues, withForm } from "@renderer/utils/form";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Spinbox } from "./ui/spinbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { placements, setFormats } from "@app/common";
import { useSelector } from "@tanstack/react-form";

const Header = withForm({
  defaultValues: MatchDefaultValues,
  render: function HeaderSection({ form }) {
    const roundFormat = useSelector(
      form.store,
      (state) => state.values.roundFormat,
    );

    return (
      <FieldGroup className="flex flex-col gap-2">
        <form.Field name="tournamentName">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Event Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                />
              </Field>
            );
          }}
        </form.Field>
        <div className="flex justify-evenly items-center my-2 gap-2">
          <form.Field name="bestOf">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Best Of</FieldLabel>
                  <Spinbox
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    id={field.name}
                    name={field.name}
                    min={1}
                    max={100}
                  />
                </Field>
              );
            }}
          </form.Field>
          <div className="flex gap-2 items-center">
            <form.Field
              name="roundFormat"
              listeners={{
                onChange: ({ value }) => {
                  if (!value.includes("Round")) {
                    form.resetField("roundNumber");
                  }
                  if (value !== "Custom Match") {
                    form.resetField("customRoundFormat");
                  }
                },
              }}
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Round Format</FieldLabel>
                    <Select
                      value={field.state.value}
                      name={field.name}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger
                        id={field.name}
                        name={field.name}
                        aria-invalid={isInvalid}
                      >
                        <SelectValue></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {placements.map((placement) => (
                          <SelectItem key={placement} value={placement}>
                            {placement}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                );
              }}
            </form.Field>
            {roundFormat.includes("Round") && (
              <form.Field name="roundNumber">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Round Number</FieldLabel>
                      <Spinbox
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onValueChange={field.handleChange}
                        min={0}
                        max={100}
                      />
                    </Field>
                  );
                }}
              </form.Field>
            )}
            {roundFormat === "Custom Match" && (
              <form.Field name="customRoundFormat">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Custom Round Name
                      </FieldLabel>
                      <Input
                        name={field.name}
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(e.currentTarget.value)
                        }
                      />
                    </Field>
                  );
                }}
              </form.Field>
            )}
          </div>
          <form.Field
            name="setFormat"
            listeners={{
              onChange: ({ value }) => {
                if (value === "Doubles") {
                  for (let i = 0; i < form.getFieldValue("teams").length; i++) {
                    while (
                      form.getFieldValue(`teams[${i}].players`).length < 2
                    ) {
                      form.pushFieldValue(`teams[${i}].players`, {
                        playerInfo: {
                          teamName: "",
                          playerTag: "",
                          pronouns: "",
                          socials: [],
                        },
                        gameInfo: {
                          character: "Random",
                          altCostume: "Default",
                          port: 2 + i + 1,
                        },
                      });
                    }
                  }
                } else {
                  for (let i = 0; i < form.getFieldValue("teams").length; i++) {
                    while (
                      form.getFieldValue(`teams[${i}].players`).length > 1
                    ) {
                      form.removeFieldValue(
                        `teams[${i}].players`,
                        form.getFieldValue(`teams[${i}].players`).length - 1,
                      );
                    }
                  }
                }
              },
            }}
          >
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Set Format</FieldLabel>
                  <Select
                    value={field.state.value}
                    name={field.name}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger
                      id={field.name}
                      name={field.name}
                      aria-invalid={isInvalid}
                    >
                      <SelectValue></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {setFormats.map((set) => (
                        <SelectItem key={set} value={set}>
                          {set}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              );
            }}
          </form.Field>
        </div>
      </FieldGroup>
    );
  },
});

export default Header;
