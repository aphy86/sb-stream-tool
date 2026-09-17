import { ReactNode } from "react";
import { useNavigationHandler } from "./hooks/use-navigation-handler";
import { Toast } from "./components/ui/toast";
import { useSlippiDataHandler } from "./hooks/use-slippi-data-handler";
import { useConnectionStatus } from "./hooks/use-connection-status";

function Layout({ children }: { children: ReactNode }) {
  useNavigationHandler();
  useSlippiDataHandler();
  useConnectionStatus();

  return (
    <div className="p-1">
      <Toast />
      {children}
    </div>
  );
}

export default Layout;
