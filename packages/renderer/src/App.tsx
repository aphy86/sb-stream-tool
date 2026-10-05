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
import GlobalHotkeys from "./components/GlobalHotkeys";
import { updateOverlay } from "@app/preload";
import Slippi from "./settings/slippi/Slippi";
import { MatchSchema } from "./utils/validators";
import { ThemeProvider } from "./context-providers/ThemeProvider";
import { EventSetsProvider } from "./context-providers/EventSetsProvider";
import { ConnectionStatusProvider } from "./context-providers/ConnectionStatusProvider";
import { useSettingsStore } from "./zustand/store";
import { Spinner } from "./components/ui/spinner";

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

  if (!isSettingsHydrated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner></Spinner> <h1>Restoring settings, please wait...</h1>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <GlobalHotkeys>
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
                          <Route
                            path="/shortcuts"
                            component={Shortcuts}
                          ></Route>
                        </Switch>
                      </Settings>
                    </Route>
                  </Switch>
                </Layout>
              </form.AppForm>
            </Router>
          </EventSetsProvider>
        </ConnectionStatusProvider>
      </GlobalHotkeys>
    </ThemeProvider>
  );
}

export default App;
