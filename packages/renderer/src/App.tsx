import { Route, Router, Switch } from "wouter";
import { GameProfileProvider, ThemeProvider } from "./hooks/providers";
import { useHashLocation } from "wouter/use-hash-location";
import Match from "./components/Match";
import Layout from "./layout";
import Settings from "./components/settings/Settings";
import PlatformSettings from "./components/settings/platform/PlatformSettings";
import { PLATFORMS } from "./platform/registry";
import { MatchDefaultValues, useAppForm } from "./utils/form";
import Obs from "./components/settings/obs/Obs";
import Slippi from "./components/slippi/Slippi";
import Shortcuts from "./components/settings/shortcuts/Shortcuts";
import GlobalHotkeys from "./components/GlobalHotkeys";
import { MatchSchema } from "./types/MatchSchema";
function App() {
  const form = useAppForm({
    defaultValues: MatchDefaultValues,
    onSubmit: async ({ value }) => {
      console.log(value);
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
            <Layout>
              <Switch>
                <Route path="/" component={() => <Match form={form} />}></Route>
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
          </Router>
        </GlobalHotkeys>
      </GameProfileProvider>
    </ThemeProvider>
  );
}

export default App;
