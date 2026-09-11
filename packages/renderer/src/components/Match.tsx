import { useSettingsStore } from "@renderer/zustand/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertTitle } from "./ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { Button } from "./ui/button";
import { getPlatformByEventUrl } from "@renderer/platform/registry";
import { useRef } from "react";
import { MatchDefaultValues, withForm } from "@renderer/utils/form";
import Header from "./Header";
import Commentators from "./Commentators";
import Teams from "./Teams";

const Match = withForm({
  defaultValues: MatchDefaultValues,
  render: function MatchScreen({ form }) {
    const eventUrl = useSettingsStore((state) => state.eventUrl);
    const eventSlug = useSettingsStore((state) => state.eventSlug);
    const platform = getPlatformByEventUrl(eventUrl);
    const apiKey = useSettingsStore(
      (state) => state.credentials[platform.id] ?? "",
    );
    const matchScreenRef = useRef<HTMLDivElement>(null);

    return (
      <div ref={matchScreenRef} className="flex flex-col gap-2">
        {apiKey === "" && eventUrl !== "" && (
          <Alert>
            <AlertCircleIcon />
            <AlertTitle>
              You must have a {platform.displayName} api key in order to use the
              automated set fetching tools for the event ${eventSlug} (go to
              settings to set it!)
            </AlertTitle>
          </Alert>
        )}
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <Header form={form} />
          <Tabs defaultValue="players">
            <TabsList className="w-full">
              <TabsTrigger value="players">Players</TabsTrigger>
              <TabsTrigger value="commentators">Commentators</TabsTrigger>
            </TabsList>
            <TabsContent value="players">
              <Teams form={form} />
            </TabsContent>
            <TabsContent value="commentators">
              <Commentators form={form} />
            </TabsContent>
          </Tabs>
          <div className="flex flex-col gap-2 my-2">
            <form.AppForm>
              <Button>UPDATE OVERLAY</Button>
              {/* <SetQuery />
              <EventSets />
              <LiveEventSets /> */}
            </form.AppForm>
          </div>
        </form>
      </div>
    );
  },
});

export default Match;
