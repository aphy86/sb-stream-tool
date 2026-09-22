import { useSettingsStore } from "@renderer/zustand/store";
import { AlertCircleIcon } from "lucide-react";
import { getPlatformByEventUrl } from "@renderer/platform/registry";
import { useRef } from "react";
import { MatchDefaultValues, withForm } from "@renderer/utils/form";
import { defaultShortcuts } from "@renderer/zustand/slices/shortcutsSlice";
import { Hotkey, useHotkey } from "@tanstack/react-hotkeys";
import FetchEvent from "./sets/FetchEvent";
import Header from "./Header";
import Teams from "./Teams";
import Commentators from "./Commentators";
import EventSets from "./sets/EventSets";
import FetchSet from "./sets/FetchSet";
import { Alert, AlertTitle } from "@renderer/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@renderer/components/ui/tabs";
import { Button } from "@renderer/components/ui/button";

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
    const submitHotkey =
      useSettingsStore((state) => state.shortcuts.get("submit")) ??
      (defaultShortcuts.get("submit") as Hotkey);

    useHotkey(submitHotkey, () => form.handleSubmit(), {
      target: matchScreenRef,
    });

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
        <FetchEvent />
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
              <FetchSet form={form} />
              <EventSets form={form} live={false} />
              <EventSets form={form} live={true} />
            </form.AppForm>
          </div>
        </form>
      </div>
    );
  },
});

export default Match;
