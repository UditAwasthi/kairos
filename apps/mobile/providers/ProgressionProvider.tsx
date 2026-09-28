import { useAuth } from '@clerk/expo';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { fetchProgression, type ProgressionView } from '../lib/api';

type RewardNotice = { xp: number; keeps: number; bonus: boolean } | null;
type ProgressionContextValue = {
  progression: ProgressionView | null;
  lastReward: RewardNotice;
  refresh: () => Promise<void>;
  clearReward: () => void;
};

const ProgressionContext = createContext<ProgressionContextValue>({
  progression: null,
  lastReward: null,
  refresh: async () => undefined,
  clearReward: () => undefined,
});

export function ProgressionProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useAuth();
  const [progression, setProgression] = useState<ProgressionView | null>(null);
  const [lastReward, setLastReward] = useState<RewardNotice>(null);
  const previous = useRef<ProgressionView | null>(null);
  const rewardTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const next = await fetchProgression(token);
      const before = previous.current;
      if (before) {
        const xp = Math.max(0, next.xp - before.xp);
        const keeps = Math.max(0, next.keeps - before.keeps);
        if (xp || keeps || next.level > before.level) {
          setLastReward({ xp, keeps, bonus: Boolean(next.lastEvent?.bonus) });
          if (rewardTimeout.current) clearTimeout(rewardTimeout.current);
          rewardTimeout.current = setTimeout(() => setLastReward(null), 2600);
        }
      }
      previous.current = next;
      setProgression(next);
    } catch {
      // Progression is supplementary and must never interrupt a core flow.
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    previous.current = null;
    setProgression(null);
    setLastReward(null);
    if (isSignedIn) void refresh();
  }, [isSignedIn, refresh]);

  useEffect(() => {
    let state: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', (next) => {
      if (state.match(/inactive|background/) && next === 'active') void refresh();
      state = next;
    });
    return () => {
      subscription.remove();
      if (rewardTimeout.current) clearTimeout(rewardTimeout.current);
    };
  }, [refresh]);

  const value = useMemo(() => ({
    progression,
    lastReward,
    refresh,
    clearReward: () => setLastReward(null),
  }), [progression, lastReward, refresh]);

  return <ProgressionContext.Provider value={value}>{children}</ProgressionContext.Provider>;
}

export function useProgression() {
  return useContext(ProgressionContext);
}
