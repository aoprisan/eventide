import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AudioEngine,
  Store,
  setHapticsEnabled,
  type Prefs,
  type Ritual,
  type SessionResult,
  type StoredSession,
} from '@eventide/engine';

interface EngineContextValue {
  audio: AudioEngine;
  store: Store;
  sessions: StoredSession[];
  prefs: Prefs;
  rituals: Ritual[];
  /** Unlock audio from within a user gesture (call before starting a session). */
  unlockAudio: () => Promise<void>;
  saveSession: (result: SessionResult) => Promise<void>;
  setPrefs: (patch: Partial<Prefs>) => void;
  setRituals: (rituals: Ritual[]) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<EngineContextValue | null>(null);

const DEFAULT_PREFS: Prefs = {
  reducedMotion: 'system',
  ambientVolume: 0.4,
  toneVolume: 0.5,
  haptics: true,
};

export function EngineProvider({ children }: { children: ReactNode }) {
  const audio = useMemo(() => new AudioEngine(), []);
  const store = useMemo(() => new Store(), []);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [prefs, setPrefsState] = useState<Prefs>(() => ({
    ...DEFAULT_PREFS,
    ...store.getPrefs(),
  }));
  const [rituals, setRitualsState] = useState<Ritual[]>(() => store.getRituals());
  const unlocked = useRef(false);

  const refresh = useCallback(async () => {
    setSessions(await store.allSessions());
  }, [store]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Mirror prefs into the engine's shared services.
  useEffect(() => {
    audio.toneVolume = prefs.toneVolume ?? 0.5;
    audio.setAmbientVolume(prefs.ambientVolume ?? 0.4);
    setHapticsEnabled(prefs.haptics ?? true);
  }, [audio, prefs.toneVolume, prefs.ambientVolume, prefs.haptics]);

  const unlockAudio = useCallback(async () => {
    await audio.unlock();
    unlocked.current = true;
  }, [audio]);

  const saveSession = useCallback(
    async (result: SessionResult) => {
      await store.addSession(result);
      await refresh();
    },
    [store, refresh],
  );

  const setPrefs = useCallback(
    (patch: Partial<Prefs>) => {
      setPrefsState((prev) => {
        const next = { ...prev, ...patch };
        store.setPrefs(next);
        return next;
      });
    },
    [store],
  );

  const setRituals = useCallback(
    (next: Ritual[]) => {
      store.setRituals(next);
      setRitualsState(next);
    },
    [store],
  );

  const value: EngineContextValue = {
    audio,
    store,
    sessions,
    prefs,
    rituals,
    unlockAudio,
    saveSession,
    setPrefs,
    setRituals,
    refresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEngine(): EngineContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEngine must be used within <EngineProvider>');
  return ctx;
}
