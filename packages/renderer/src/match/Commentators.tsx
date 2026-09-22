import { MatchDefaultValues, withForm } from "@renderer/utils/form";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const CommentatorField = ({ ...props }: React.ComponentProps<typeof Field>) => {
  return <Field className="flex flex-col gap-0.5" {...props}></Field>;
};

const CommentatorFieldLabel = ({
  ...props
}: React.ComponentProps<typeof FieldLabel>) => {
  return <FieldLabel className="font-semibold pl-0.5" {...props}></FieldLabel>;
};

const Commentators = withForm({
  defaultValues: MatchDefaultValues,
  render: function CommentatorsScreen({ form }) {
    return (
      <div className="px-2">
        <form.Field name="commentators" mode="array">
          {(field) => (
            <>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    field.pushValue({
                      name: "",
                      pronouns: "",
                      socials: [{ platform: "", username: "" }],
                    });
                  }}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (field.state.value.length > 1) {
                      field.removeValue(field.state.value.length - 1);
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
              <div className="flex flex-col gap-4">
                {field.state.value.map((_, i) => {
                  return (
                    <div key={i}>
                      <h1 className="font-semibold pl-1 text-lg">
                        Commentator {i + 1}
                      </h1>
                      <div className="mt-2 flex flex-col gap-2">
                        <form.Field name={`commentators[${i}].name`}>
                          {(subField) => {
                            return (
                              <CommentatorField>
                                <CommentatorFieldLabel htmlFor={subField.name}>
                                  Name
                                </CommentatorFieldLabel>
                                <Input
                                  id={subField.name}
                                  name={subField.name}
                                  value={subField.state.value}
                                  onChange={(e) =>
                                    subField.handleChange(e.currentTarget.value)
                                  }
                                />
                              </CommentatorField>
                            );
                          }}
                        </form.Field>
                        <form.Field name={`commentators[${i}].pronouns`}>
                          {(subField) => {
                            return (
                              <CommentatorField>
                                <CommentatorFieldLabel htmlFor={subField.name}>
                                  Pronouns
                                </CommentatorFieldLabel>
                                <Input
                                  id={subField.name}
                                  name={subField.name}
                                  value={subField.state.value}
                                  onChange={(e) =>
                                    subField.handleChange(e.currentTarget.value)
                                  }
                                />
                              </CommentatorField>
                            );
                          }}
                        </form.Field>
                        <form.Field
                          name={`commentators[${i}].socials`}
                          mode="array"
                        >
                          {(subField) => {
                            return (
                              <>
                                {subField.state.value.map((_, j) => {
                                  return (
                                    <div
                                      key={j}
                                      className="flex flex-col gap-2"
                                    >
                                      <form.Field
                                        name={`commentators[${i}].socials[${j}].platform`}
                                      >
                                        {(platformSubfield) => {
                                          return (
                                            <CommentatorField>
                                              <CommentatorFieldLabel
                                                htmlFor={platformSubfield.name}
                                              >
                                                Platform
                                              </CommentatorFieldLabel>
                                              <Input
                                                id={platformSubfield.name}
                                                name={platformSubfield.name}
                                                value={
                                                  platformSubfield.state.value
                                                }
                                                onChange={(e) =>
                                                  platformSubfield.handleChange(
                                                    e.currentTarget.value,
                                                  )
                                                }
                                              ></Input>
                                            </CommentatorField>
                                          );
                                        }}
                                      </form.Field>
                                      <form.Field
                                        name={`commentators[${i}].socials[${j}].username`}
                                      >
                                        {(nameSubfield) => {
                                          return (
                                            <CommentatorField>
                                              <CommentatorFieldLabel
                                                htmlFor={nameSubfield.name}
                                              >
                                                Socials
                                              </CommentatorFieldLabel>
                                              <Input
                                                id={nameSubfield.name}
                                                name={nameSubfield.name}
                                                value={nameSubfield.state.value}
                                                onChange={(e) =>
                                                  nameSubfield.handleChange(
                                                    e.currentTarget.value,
                                                  )
                                                }
                                              ></Input>
                                            </CommentatorField>
                                          );
                                        }}
                                      </form.Field>
                                    </div>
                                  );
                                })}
                              </>
                            );
                          }}
                        </form.Field>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </form.Field>
      </div>
    );
  },
});

export default Commentators;
