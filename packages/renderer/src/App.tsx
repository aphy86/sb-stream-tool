import { Route, Router, Switch } from "wouter";
import { GameProfileProvider, ThemeProvider } from "./hooks/providers";
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

  return (
    <ThemeProvider defaultTheme="dark">
      <GameProfileProvider>
        <GlobalHotkeys>
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
        </GlobalHotkeys>
      </GameProfileProvider>
    </ThemeProvider>
  );
}

export default App;
