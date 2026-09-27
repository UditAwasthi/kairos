import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '../../components/ThemedText';
import { GlassPanel } from '../../components/ui/Glass';
import { SoftLinkList, SoftPage, SoftRow } from '../../components/ui/SoftScreen';
import { useAsync } from '../../hooks/useAsync';
import { fetchProgression, patchProgression } from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';

export default function PrivacyScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { colors } = useAppTheme();
  const { data, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    return fetchProgression(token);
  }, [getToken], { cacheKey: 'progression' });

  const toggleBoard = useCallback(
    async (next: boolean) => {
      const token = await getToken();
      if (!token) return;
      await patchProgression(token, { leaderboardVisible: next });
      reload();
    },
    [getToken, reload],
  );

  return (
    <SoftPage>
      <SoftRow icon="archive" label="Stores uploads & memory" />
      <SoftRow icon="cpu" label="Processes on Kairos" />
      <SoftRow icon="bell" label="Push alerts use this device token" />
      <SoftRow icon="eye" label="Recall stays on-device first" />

      <GlassPanel contentStyle={styles.boardRow}>
        <View style={styles.boardCopy}>
          <ThemedText colorKey="text" style={styles.boardTitle}>
            Show me on the world board
          </ThemedText>
          <ThemedText colorKey="textMuted" style={styles.boardHint}>
            On by default. Strength and streak are visible, not your memories.
          </ThemedText>
        </View>
        <Switch
          value={data?.leaderboardVisible ?? true}
          onValueChange={(value) => void toggleBoard(value)}
          trackColor={{ false: colors.surfaceContainer, true: colors.accentLilac }}
          thumbColor={colors.accentPurple}
          accessibilityLabel="Show me on the world board"
        />
      </GlassPanel>

      <SoftLinkList
        items={[
          {
            label: 'World',
            icon: 'compass',
            onPress: () => router.push('/(app)/progression'),
          },
          {
            label: 'Recall',
            icon: 'eye',
            onPress: () => router.push('/(app)/(tabs)/recall'),
          },
          {
            label: 'Data',
            icon: 'database',
            onPress: () => router.push('/(app)/data'),
          },
          {
            label: 'Devices',
            icon: 'smartphone',
            onPress: () => router.push('/(app)/devices'),
          },
        ]}
      />
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  boardCopy: { flex: 1, gap: 4 },
  boardTitle: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  boardHint: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
});
