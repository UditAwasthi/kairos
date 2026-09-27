import { useAuth, useUser } from '@clerk/expo';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Leaderboard } from '../../components/progression/Leaderboard';
import { ProgressDashboard } from '../../components/progression/ProgressDashboard';
import { ThemedText } from '../../components/ThemedText';
import {
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
  SoftRefreshBar,
} from '../../components/ui/EmptyState';
import { SoftPage, SoftTitle } from '../../components/ui/SoftScreen';
import { useAsync } from '../../hooks/useAsync';
import {
  buyProgressionFreeze,
  fetchLeaderboard,
  fetchProgression,
  patchProgression,
} from '../../lib/api';

export default function ProgressionScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [scope, setScope] = useState<'global' | 'circle'>('global');
  const [buying, setBuying] = useState(false);

  const progress = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    const name = user?.firstName || user?.fullName || undefined;
    const data = await fetchProgression(token);
    if (name && !data.displayName) {
      return patchProgression(token, { displayName: name });
    }
    return data;
  }, [getToken, user?.firstName, user?.fullName], { cacheKey: 'progression' });

  const board = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    return fetchLeaderboard(token, scope);
  }, [getToken, scope], { cacheKey: `leaderboard:${scope}` });

  const reload = useCallback(() => {
    progress.reload();
    board.reload();
  }, [progress, board]);

  const act = useCallback(
    async (run: (token: string) => Promise<unknown>) => {
      const token = await getToken();
      if (!token) return;
      await run(token);
      reload();
    },
    [getToken, reload],
  );

  if (progress.loading && !progress.data) return <LoadingSkeleton rows={7} />;
  if (progress.error && !progress.data) {
    return <ErrorState title="Unable to load" onRetry={reload} />;
  }
  if (!progress.data) return null;

  return (
    <FadeInContent>
      <SoftRefreshBar active={progress.refreshing || board.refreshing} />
      <SoftPage>
        <SoftTitle>World</SoftTitle>
        <ThemedText colorKey="textMuted" style={styles.lead}>
          One measure of how steadily you have been remembering. Bonuses are rare on purpose.
        </ThemedText>
        <ProgressDashboard
          data={progress.data}
          buying={buying}
          onBuyFreeze={() => {
            setBuying(true);
            void act((token) => buyProgressionFreeze(token)).finally(() => setBuying(false));
          }}
          onEquip={(slot, key) => {
            void act((token) =>
              patchProgression(token, slot === 'title' ? { equippedTitle: key } : { equippedAura: key }),
            );
          }}
        />
        <ThemedText colorKey="text" style={styles.boardTitle}>
          Among others
        </ThemedText>
        {board.data ? (
          <Leaderboard data={board.data} scope={scope} onScope={setScope} />
        ) : board.error ? (
          <ThemedText colorKey="textMuted" style={styles.lead}>
            Leaderboard is unavailable right now.
          </ThemedText>
        ) : (
          <LoadingSkeleton rows={3} />
        )}
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  boardTitle: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 22,
    letterSpacing: -0.3,
    marginTop: 18,
    marginBottom: 8,
  },
});
