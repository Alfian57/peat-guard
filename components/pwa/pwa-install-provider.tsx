"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaInstallState = {
  canInstall: boolean;
  error: string | null;
  install: () => Promise<boolean>;
  installed: boolean;
  ios: boolean;
  isInstalling: boolean;
  isSecureContext: boolean;
};

const PwaInstallContext = createContext<PwaInstallState | null>(null);
const standaloneDisplayMode = "(display-mode: standalone)";

function subscribeDisplayMode(listener: () => void) {
  const media = window.matchMedia(standaloneDisplayMode);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function getStandalone() {
  return (
    window.matchMedia(standaloneDisplayMode).matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}

function getIos() {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function getSecureContext() {
  return window.isSecureContext;
}

function subscribeDevice() {
  return () => undefined;
}

function serverSnapshot() {
  return false;
}

function isInstallPrompt(event: Event): event is InstallPromptEvent {
  return (
    "prompt" in event &&
    typeof event.prompt === "function" &&
    "userChoice" in event
  );
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const standalone = useSyncExternalStore(
    subscribeDisplayMode,
    getStandalone,
    serverSnapshot,
  );
  const ios = useSyncExternalStore(subscribeDevice, getIos, serverSnapshot);
  const isSecureContext = useSyncExternalStore(
    subscribeDevice,
    getSecureContext,
    serverSnapshot,
  );
  const promptRef = useRef<InstallPromptEvent | null>(null);
  const promptOpenRef = useRef(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      if (!isInstallPrompt(event)) return;
      event.preventDefault();
      promptRef.current = event;
      setError(null);
      setCanInstall(true);
    };
    const onInstalled = () => {
      promptRef.current = null;
      setInstalled(true);
      setCanInstall(false);
      setError(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (promptOpenRef.current) return true;
    const prompt = promptRef.current;
    if (!prompt || standalone || installed) return false;

    // Each browser event can be used only once. Keep any fresh event delivered
    // while the current dialog is open for the next click.
    promptRef.current = null;
    promptOpenRef.current = true;
    setCanInstall(false);
    setIsInstalling(true);
    setError(null);
    try {
      await prompt.prompt();
      await prompt.userChoice;
      return true;
    } catch {
      setError("Pemasangan belum dapat dibuka. Coba melalui menu browser.");
      return false;
    } finally {
      promptOpenRef.current = false;
      setIsInstalling(false);
    }
  }, [installed, standalone]);

  const value = useMemo<PwaInstallState>(
    () => ({
      canInstall: canInstall && !installed && !standalone,
      error,
      install,
      installed: installed || standalone,
      ios,
      isInstalling,
      isSecureContext,
    }),
    [
      canInstall,
      error,
      install,
      installed,
      ios,
      isInstalling,
      isSecureContext,
      standalone,
    ],
  );

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const installState = useContext(PwaInstallContext);
  if (!installState) throw new Error("PwaInstallProvider tidak tersedia.");
  return installState;
}
