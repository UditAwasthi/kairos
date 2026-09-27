import { Pressable, StyleSheet, View } from 'react-native';

import type { ProgressionSummary } from '../../lib/api';
import { rewardLine, streakAssetHint, worldStrengthLabel } from '../../lib/progression';
import { useAppTheme } from '../../providers/ThemeProvider';
import { ThemedText } from '../ThemedText';
import { ThemedButton } from '../ui/ThemedButton';
import { GlassPanel } from '../ui/Glass';

export function ProgressDashboard({
  data,
  onBuyFreeze,
  onEquip,
  buying,
}: {
  data: ProgressionSummary;
  onBuyFreeze: () => void;
  onEquip: (slot: 'title' | 'aura', key: string) => void;
  buying?: boolean;
}) {
  const { colors } = useAppTheme();
  const reward = rewardLine(data.lastEvent);
  const titles = data.unlocks.filter((item) => item.kind === 'title');
  const auras = data.unlocks.filter((item) => item.kind === 'aura');

  return (
    <View style={styles.stack}>
      <GlassPanel>
        <ThemedText colorKey="textMuted" style={styles.kicker}>
          Primary metric
        </ThemedText>
        <ThemedText colorKey="text" style={styles.level}>
          {worldStrengthLabel(data.level)}
        </ThemedText>
        <View style={[styles.track, { backgroundColor: colors.surfaceContainer }]}>
          <View
            style={[
              styles.fill,
              {
                backgroundColor: colors.accentPurple,
                width: `${Math.round(data.progress * 100)}%`,
              },
            ]}
          />
        </View>
        <ThemedText colorKey="textMuted" style={styles.meta}>
          {data.intoLevel} / {data.nextLevelXp - (data.xp - data.intoLevel)} toward the next layer · {data.keeps} keeps
        </ThemedText>
      </GlassPanel>

      <GlassPanel>
        <ThemedText colorKey="textMuted" style={styles.kicker}>
          The run
        </ThemedText>
        <ThemedText colorKey="text" style={styles.streak}>
          {data.currentStreak} day{data.currentStreak === 1 ? '' : 's'}
        </ThemedText>
        <ThemedText colorKey="textMuted" style={styles.meta}>
          Longest {data.longestStreak}. {streakAssetHint(data)}
        </ThemedText>
        {data.equippedTitleLabel || data.equippedAuraLabel ? (
          <ThemedText colorKey="text" style={styles.wear}>
            {[data.equippedTitleLabel, data.equippedAuraLabel].filter(Boolean).join(' · ')}
          </ThemedText>
        ) : (
          <ThemedText colorKey="textMuted" style={styles.meta}>
            Streak-gated titles rest if a day is missed without a freeze.
          </ThemedText>
        )}
        <ThemedButton
          label={buying ? '…' : `Keep a freeze · ${data.freezeCost} keeps`}
          onPress={onBuyFreeze}
          disabled={buying || data.keeps < data.freezeCost}
          variant="outline"
          style={styles.freezeBtn}
        />
      </GlassPanel>

      {reward ? (
        <GlassPanel>
          <ThemedText colorKey="textMuted" style={styles.kicker}>
            Just now
          </ThemedText>
          <ThemedText colorKey="text" style={styles.reward}>
            {reward}
          </ThemedText>
        </GlassPanel>
      ) : null}

      {titles.length > 0 || auras.length > 0 ? (
        <GlassPanel>
          <ThemedText colorKey="textMuted" style={styles.kicker}>
            Worn from the run
          </ThemedText>
          <View style={styles.chips}>
            {titles.map((item) => (
              <Pressable
                key={item.key}
                disabled={!item.available}
                onPress={() => onEquip('title', item.key)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={[
                  styles.chip,
                  {
                    backgroundColor: item.available ? colors.accentLavender : colors.surfaceContainer,
                    opacity: item.available ? 1 : 0.5,
                  },
                ]}
              >
                <ThemedText colorKey="text" style={styles.chipLabel}>
                  {item.label}
                </ThemedText>
              </Pressable>
            ))}
            {auras.map((item) => (
              <Pressable
                key={item.key}
                disabled={!item.available}
                onPress={() => onEquip('aura', item.key)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={[
                  styles.chip,
                  {
                    backgroundColor: item.available ? colors.accentPeach : colors.surfaceContainer,
                    opacity: item.available ? 1 : 0.5,
                  },
                ]}
              >
                <ThemedText colorKey="text" style={styles.chipLabel}>
                  {item.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </GlassPanel>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  kicker: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  level: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 28,
    letterSpacing: -0.4,
  },
  streak: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 26,
    letterSpacing: -0.3,
  },
  track: {
    height: 8,
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 12,
  },
  fill: { height: 8, borderRadius: 99 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 8 },
  wear: { fontFamily: 'Inter_500Medium', fontSize: 15, marginTop: 10 },
  reward: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  freezeBtn: { alignSelf: 'flex-start', marginTop: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  chipLabel: { fontFamily: 'Inter_500Medium', fontSize: 13 },
});
