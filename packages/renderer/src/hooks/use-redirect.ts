import { clearAllListeners, redirect } from "@app/preload";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function useRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => {
    redirect((location) => {
      navigate(`/${location}`);
    });
    return () => clearAllListeners("redirect");
  }, [navigate]);
}
