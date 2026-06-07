import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface PwaContextValue {
  /** A newer build is installed and waiting to take over. */
  needRefresh: boolean;
  /** The app is cached and ready to work offline. */
  offlineReady: boolean;
  /** True while a manual update check is in flight. */
  checking: boolean;
  /** ISO 8601 timestamp of the running build. */
  buildTime: string;
  /** Ask the browser to look for a newer service worker now. */
  checkForUpdate: () => Promise<void>;
  /** Activate the waiting build and reload into it. */
  applyUpdate: () => void;
}

const Ctx = createContext<PwaContextValue | null>(null);

export function PwaProvider({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(false);
  const regRef = useRef<ServiceWorkerRegistration | undefined>(undefined);

  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, reg) {
      regRef.current = reg;
    },
  });

  const checkForUpdate = useCallback(async () => {
    setChecking(true);
    try {
      const reg = regRef.current ?? (await navigator.serviceWorker?.getRegistration());
      await reg?.update();
    } catch {
      // Network error or unsupported browser — leave the UI unchanged.
    } finally {
      setChecking(false);
    }
  }, []);

  const applyUpdate = useCallback(() => {
    void updateServiceWorker(true);
  }, [updateServiceWorker]);

  const value: PwaContextValue = {
    needRefresh,
    offlineReady,
    checking,
    buildTime: __BUILD_TIME__,
    checkForUpdate,
    applyUpdate,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePwa(): PwaContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePwa must be used within PwaProvider');
  return ctx;
}
