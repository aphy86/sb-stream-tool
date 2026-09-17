import { ReactNode } from "react";
import { useNavigationHandler } from "./hooks/use-navigation-handler";
import { Toast } from "./components/ui/toast";
import { useSlippiDataHandler } from "./hooks/use-slippi-data-handler";

function Layout({ children }: { children: ReactNode }) {
  useNavigationHandler();
  useSlippiDataHandler();

  return (
    <div className="p-1">
      <Toast />
      {children}
    </div>
  );
}

export default Layout;
