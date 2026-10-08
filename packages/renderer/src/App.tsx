import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import Match from "./match/Match";
import Layout from "./layout";
import Settings from "./settings/Settings";
import PlatformSettings from "./settings/platform/PlatformSettings";
import { PLATFORMS } from "./platform/registry";
import { MatchDefaultValues, useAppForm } from "./utils/form";
import Obs from "./settings/obs/Obs";
import Shortcuts from "./settings/shortcuts/Shortcuts";
import { onGlobalShortcut, send, updateOverlay } from "@app/preload";
import Slippi from "./settings/slippi/Slippi";
import { MatchSchema } from "./utils/validators";
import { ThemeProvider } from "./context-providers/ThemeProvider";
import { EventSetsProvider } from "./context-providers/EventSetsProvider";
import { ConnectionStatusProvider } from "./context-providers/ConnectionStatusProvider";
import { useSettingsStore } from "./zustand/store";
import { Spinner } from "./components/ui/spinner";
import { clamp } from "./utils/helpers";
import { useEffect } from "react";
import { GlobalAction } from "@app/common";

function App() {
  const form = useAppForm({
    defaultValues: MatchDefaultValues,
    onSubmit: async ({ value }) => {
      console.log(value);
      updateOverlay(value).catch(console.error);
    },
    validators: {
      onChange: MatchSchema,
    },
  });

  const isSettingsHydrated = useSettingsStore(
    (state) => state.isSettingsHydrated,
  );

  // global shortcuts
  useEffect(() => {
    const changeScore = (team: number, delta: number) =>
      form.setFieldValue(
        `teams[${team}].score`,
        clamp(form.getFieldValue(`teams[${team}].score`) + delta, 100, 0),
      );

    const handlers: Record<GlobalAction, () => void> = {
      "obs-quick-reconnect": () => {
        const { websocketIp, websocketPort, websocketPassword } =
          useSettingsStore.getState();
        if (websocketIp && websocketPort && websocketPassword) {
          send("obs/connect", websocketIp, websocketPort, websocketPassword);
        }
      },
      "obs-disconnect": () => send("obs/disconnect"),
      "team-left-score-up": () => changeScore(0, +1),
      "team-left-score-down": () => changeScore(0, -1),
      "team-right-score-up": () => changeScore(1, +1),
      "team-right-score-down": () => changeScore(1, -1),
    };

    return onGlobalShortcut((action) => handlers[action]());
  }, [form]);

  if (!isSettingsHydrated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner></Spinner> <h1>Restoring settings, please wait...</h1>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <ConnectionStatusProvider>
        <EventSetsProvider>
          <Router hook={useHashLocation}>
            <form.AppForm>
              <Layout>
                <Switch>
                  <Route
                    path="/"
                    component={() => <Match form={form} />}
                  ></Route>
                  <Route path="/settings" nest>
                    <Settings>
                      <Switch>
                        <Route path="/" component={Obs}></Route>
                        <Route path="/obs" component={Obs}></Route>
                        {PLATFORMS.map((platform) => (
                          <Route key={platform.id} path={`/${platform.id}`}>
                            <PlatformSettings platform={platform} />
                          </Route>
                        ))}
                        <Route path="/slippi" component={Slippi}></Route>
                        <Route path="/shortcuts" component={Shortcuts}></Route>
                      </Switch>
                    </Settings>
                  </Route>
                </Switch>
              </Layout>
            </form.AppForm>
          </Router>
        </EventSetsProvider>
      </ConnectionStatusProvider>
    </ThemeProvider>
  );
}

export default App;
