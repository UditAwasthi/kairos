import { Pressable, StyleSheet, View } from 'react-native';

import type { LeaderboardSummary } from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';
import { ThemedText } from '../ThemedText';
import { GlassPanel } from '../ui/Glass';

export function Leaderboard({
  data,
  scope,
  onScope,
}: {
  data: LeaderboardSummary;
  scope: 'global' | 'circle';
  onScope: (scope: 'global' | 'circle') => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.stack}>
      <View style={styles.tabs}>
        {(['global', 'circle'] as const).map((item) => (
          <Pressable
            key={item}
            onPress={() => onScope(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: scope === item }}
            accessibilityLabel={item === 'global' ? 'Everyone' : 'Circle'}
            style={[
              styles.tab,
              {
                backgroundColor: scope === item ? colors.accentLavender : colors.surfaceContainer,
              },
            ]}
          >
            <ThemedText colorKey="text" style={styles.tabLabel}>
              {item === 'global' ? 'Everyone' : 'Circle'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {data.selfRank ? (
        <ThemedText colorKey="textMuted" style={styles.rank}>
          You are {data.selfRank} of the visible board.
        </ThemedText>
      ) : (
        <ThemedText colorKey="textMuted" style={styles.rank}>
          Hidden from the board. You can still look.
        </ThemedText>
      )}

      {data.rows.length === 0 ? (
        <GlassPanel>
          <ThemedText colorKey="textMuted" style={styles.empty}>
            {scope === 'circle'
              ? 'No circle yet. The global board is the default.'
              : 'No public keepers yet.'}
          </ThemedText>
        </GlassPanel>
      ) : (
        data.rows.map((row) => (
          <GlassPanel
            key={row.userId}
            contentStyle={[
              styles.row,
              row.self ? { backgroundColor: colors.accentLavender } : null,
            ]}
          >
            <ThemedText colorKey="textMuted" style={styles.pos}>
              {row.rank}
            </ThemedText>
            <View style={styles.copy}>
              <ThemedText colorKey="text" style={styles.name} numberOfLines={1}>
                {row.self ? `${row.displayName} · you` : row.displayName}
              </ThemedText>
              <ThemedText colorKey="textMuted" style={styles.meta} numberOfLines={1}>
                Strength {row.level}
                {row.title ? ` · ${row.title}` : ''} · {row.currentStreak}d
              </ThemedText>
            </View>
          </GlassPanel>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  tabLabel: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  rank: { fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 4 },
  empty: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pos: { fontFamily: 'Inter_500Medium', fontSize: 15, width: 28 },
  copy: { flex: 1, gap: 2 },
  name: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
