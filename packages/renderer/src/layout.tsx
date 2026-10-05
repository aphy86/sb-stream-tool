import { ReactNode } from "react";
import { useRedirect } from "./hooks/use-redirect";
import { Toast } from "./components/ui/toast";
import { useSlippiDataHandler } from "./hooks/use-slippi-data-handler";

function Layout({ children }: { children: ReactNode }) {
  useRedirect();
  useSlippiDataHandler();

  return (
    <div className="p-1">
      <Toast />
      {children}
    </div>
  );
}

export default Layout;
