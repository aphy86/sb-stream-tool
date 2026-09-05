import { Route, Router, Switch } from "wouter";
import { PlayerFormFieldArrayProvider, ThemeProvider } from "./hooks/providers";
import { useHashLocation } from "wouter/use-hash-location";
import Match from "./components/Match";
import Layout from "./layout";
import Settings from "./components/settings/Settings";
import PlatformSettings from "./components/settings/platform/PlatformSettings";
import { PLATFORMS } from "./platform/registry";
import { FormProvider, useForm } from "react-hook-form";
import { Tournament } from "@app/common";
import { TournamentDefaultValues } from "./utils/form";
import Obs from "./components/settings/obs/Obs";
import Slippi from "./components/slippi/Slippi";
import Shortcuts from "./components/settings/shortcuts/Shortcuts";
import GlobalHotkeys from "./components/GlobalHotkeys";

function App() {
  const methods = useForm<Tournament>({
    defaultValues: TournamentDefaultValues,
  });
  return (
    <ThemeProvider defaultTheme="dark">
      <FormProvider {...methods}>
        <PlayerFormFieldArrayProvider>
          <GlobalHotkeys>
            <Router hook={useHashLocation}>
              <Layout>
                <Switch>
                  <Route path="/" component={Match}></Route>
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
        </PlayerFormFieldArrayProvider>
      </FormProvider>
    </ThemeProvider>
  );
}

export default App;
