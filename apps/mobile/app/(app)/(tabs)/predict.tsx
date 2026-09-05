import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { Badge } from '../../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { TextAction } from '../../../components/ui/TextAction';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedText } from '../../../components/ThemedText';
import { useAsync } from '../../../hooks/useAsync';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { formatPredictionMinutes, predictionsService } from '../../../services';

type QuickAction = {
  id: string;
  label: string;
  hint: string;
  href: string;
};

export default function PredictScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useAppTheme();
  const { data, error, loading, reload } = useAsync(() => predictionsService.getPrimary(), []);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error) {
    return <ErrorState title="Unable to load prediction" message={error} onRetry={reload} />;
  }
  if (!data) {
    return (
      <EmptyState
        title="More observations are needed"
        message="More observations are needed before Kairos can produce an estimate."
        actionLabel="Record observation"
        onAction={() => router.push('/(app)/event/add')}
      />
    );
  }

  const delta = data.estimatedMinutes - data.historicalBaselineMinutes;
  const deltaLabel =
    delta === 0
      ? 'Same as baseline'
      : `${delta > 0 ? '+' : ''}${formatPredictionMinutes(Math.abs(delta))} vs baseline`;

  const maxBar = Math.max(
    data.estimatedMinutes + data.uncertaintyMinutes,
    data.historicalBaselineMinutes,
    1,
  );

  const quickActions: QuickAction[] = [
    {
      id: 'detail',
      label: 'Full detail',
      hint: 'Inputs, model, limits',
      href: `/(app)/prediction/${data.id}`,
    },
    {
      id: 'scenario',
      label: 'What if?',
      hint: 'Scenario simulator',
      href: '/(app)/scenario',
    },
    {
      id: 'evidence',
      label: 'Evidence',
      hint: 'Features & metrics',
      href: '/(app)/evidence',
    },
    {
      id: 'recs',
      label: 'Suggestions',
      hint: 'Cautious guidance',
      href: '/(app)/recommendations',
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: spacing['5'],
          paddingTop: spacing['5'],
          paddingBottom: insets.bottom + 28,
          gap: spacing['4'],
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText colorKey="textMuted" style={styles.eyebrow}>
            Forecast
          </ThemedText>
          <ThemedText colorKey="text" style={styles.pageTitle}>
            Predict
          </ThemedText>
          <ThemedText colorKey="textSecondary" style={styles.lede}>
            Next-day productive study time — model estimate vs your historical baseline.
          </ThemedText>
        </View>
        <Badge label="Mock" tone="accent" />
      </View>

      {/* Hero estimate */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/(app)/prediction/${data.id}`);
        }}
        accessibilityRole="button"
        accessibilityLabel="Open prediction detail"
      >
        <View
          style={[
            styles.hero,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing['5'],
              gap: spacing['4'],
              ...colors.shadowElevated,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <ThemedText colorKey="textMuted" style={styles.kicker}>
              Model estimate
            </ThemedText>
            <TextAction
              label="Details →"
              onPress={() => router.push(`/(app)/prediction/${data.id}`)}
            />
          </View>

          <ThemedText colorKey="text" style={styles.target}>
            {data.targetLabel}
          </ThemedText>

          <View style={styles.estimateRow}>
            <ThemedText colorKey="accent" style={styles.estimateValue}>
              {formatPredictionMinutes(data.estimatedMinutes)}
            </ThemedText>
            <View
              style={[
                styles.uncertaintyPill,
                {
                  borderColor: colors.borderActive,
                  borderRadius: radius.full,
                  backgroundColor: colors.surfaceElevated,
                },
              ]}
            >
              <ThemedText colorKey="text" style={styles.uncertaintyText}>
                ±{data.uncertaintyMinutes}m
              </ThemedText>
            </View>
          </View>

          <ThemedText
            colorKey={delta >= 0 ? 'textSecondary' : 'textMuted'}
            style={styles.delta}
          >
            {deltaLabel}
          </ThemedText>

          {/* Visual compare: baseline vs estimate */}
          <View style={{ gap: spacing['3'] }}>
            <CompareBar
              label="Historical baseline"
              valueLabel={formatPredictionMinutes(data.historicalBaselineMinutes)}
              widthPct={(data.historicalBaselineMinutes / maxBar) * 100}
              tone="muted"
            />
            <CompareBar
              label="Model estimate"
              valueLabel={formatPredictionMinutes(data.estimatedMinutes)}
              widthPct={(data.estimatedMinutes / maxBar) * 100}
              tone="accent"
              bandPct={(data.uncertaintyMinutes / maxBar) * 100}
            />
          </View>
        </View>
      </Pressable>

      {/* Compact metrics */}
      <View style={[styles.metaGrid, { gap: spacing['2'] }]}>
        <MetaTile label="Model" value={`${data.modelName}`} sub={data.modelVersion} />
        <MetaTile label="MAE" value={`${data.evaluationMaeMinutes}m`} sub="evaluation" />
        <MetaTile label="Window" value={`${data.observationWindowDays}d`} sub="observed" />
        <MetaTile label="Sample" value={`${data.sampleSize}`} sub="observations" />
      </View>

      {/* Quick destinations — usable 2×2, not a button stack */}
      <SectionHeader title="Explore" subtitle="Next steps from this estimate" />
      <View style={[styles.actionGrid, { gap: spacing['2'] }]}>
        {quickActions.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(action.href as never);
            }}
            style={[
              styles.actionTile,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing['3'],
                flexBasis: '47%',
                flexGrow: 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <ThemedText colorKey="accent" style={styles.actionLabel}>
              {action.label}
            </ThemedText>
            <ThemedText colorKey="textSecondary" style={styles.actionHint}>
              {action.hint}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Inputs feeding the estimate */}
      <SectionHeader title="Current inputs" />
      <SurfaceCard>
        {data.inputs.map((input, index) => (
          <View
            key={input.label}
            style={[
              styles.inputRow,
              index < data.inputs.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.divider,
                marginBottom: spacing['2'],
                paddingBottom: spacing['2'],
              },
            ]}
          >
            <ThemedText colorKey="textMuted" style={styles.inputLabel}>
              {input.label}
            </ThemedText>
            <ThemedText colorKey="text" style={styles.inputValue}>
              {input.value}
            </ThemedText>
          </View>
        ))}
      </SurfaceCard>

      <View
        style={[
          styles.disclaimer,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing['3'],
          },
        ]}
      >
        <ThemedText colorKey="textMuted" style={styles.disclaimerText}>
          Estimates are observational mock values for frontend development — not causal claims or
          live model inference.
        </ThemedText>
        <ThemedButton
          label="Inspect evidence"
          variant="text"
          onPress={() => router.push('/(app)/evidence')}
        />
      </View>
    </ScrollView>
  );
}

function CompareBar({
  label,
  valueLabel,
  widthPct,
  tone,
  bandPct,
}: {
  label: string;
  valueLabel: string;
  widthPct: number;
  tone: 'muted' | 'accent';
  bandPct?: number;
}) {
  const { colors, spacing, radius } = useAppTheme();
  const fill = tone === 'accent' ? colors.accent : colors.text;
  const track = colors.border;
  const clamped = Math.max(4, Math.min(100, widthPct));

  return (
    <View style={{ gap: spacing['1'] }}>
      <View style={styles.compareHeader}>
        <ThemedText colorKey="textMuted" style={styles.compareLabel}>
          {label}
        </ThemedText>
        <ThemedText colorKey="text" style={styles.compareValue}>
          {valueLabel}
        </ThemedText>
      </View>
      <View
        style={[
          styles.track,
          { backgroundColor: track, borderRadius: radius.sm, height: 8 },
        ]}
      >
        <View
          style={{
            width: `${clamped}%` as `${number}%`,
            height: '100%',
            borderRadius: radius.sm,
            backgroundColor: fill,
            opacity: tone === 'accent' ? 1 : 0.45,
          }}
        />
        {bandPct != null ? (
          <View
            style={[
              styles.band,
              {
                left: `${Math.max(0, clamped - bandPct)}%` as `${number}%`,
                width: `${Math.min(100, bandPct * 2)}%` as `${number}%`,
                backgroundColor: colors.accentGlow,
                borderRadius: radius.sm,
              },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

function MetaTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  const { colors, spacing, radius } = useAppTheme();

  return (
    <View
      style={[
        styles.metaTile,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing['3'],
          gap: 2,
        },
      ]}
    >
      <ThemedText colorKey="textMuted" style={styles.metaLabel}>
        {label}
      </ThemedText>
      <ThemedText colorKey="text" style={styles.metaValue}>
        {value}
      </ThemedText>
      <ThemedText colorKey="textMuted" style={styles.metaSub}>
        {sub}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  eyebrow: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 26,
    letterSpacing: -0.4,
  },
  lede: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
    maxWidth: 280,
  },
  hero: {
    borderWidth: 1,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  target: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  estimateValue: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 44,
    letterSpacing: -1,
    lineHeight: 48,
  },
  uncertaintyPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  uncertaintyText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  delta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    letterSpacing: -0.1,
  },
  compareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compareLabel: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  compareValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    opacity: 0.9,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaTile: {
    borderWidth: 1,
    width: '47%',
    flexGrow: 1,
  },
  metaLabel: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  metaSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionTile: {
    borderWidth: 1,
    minHeight: 72,
    gap: 4,
  },
  actionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  actionHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    flex: 1,
  },
  inputValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    textAlign: 'right',
    flex: 1,
  },
  disclaimer: {
    borderWidth: 1,
    gap: 8,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
});
