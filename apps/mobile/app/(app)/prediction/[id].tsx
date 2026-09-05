import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, StyleSheet, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedText } from '../../../components/ThemedText';
import { useAsync } from '../../../hooks/useAsync';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { formatPredictionMinutes, predictionsService } from '../../../services';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PredictionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();
  const [techOpen, setTechOpen] = useState(false);
  const { data, error, loading, reload } = useAsync(
    () => predictionsService.getById(String(id)),
    [id],
  );

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error || !data) {
    return (
      <ErrorState title="Unable to load prediction" message={error ?? undefined} onRetry={reload} />
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader title="Prediction" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.kicker}>
          Model estimate
        </ThemedText>
        <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.title}>
          {data.targetLabel}
        </ThemedText>
        <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.value}>
          {formatPredictionMinutes(data.estimatedMinutes)}
        </ThemedText>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Uncertainty ±{data.uncertaintyMinutes}m
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Inputs" />
      <SurfaceCard>
        {data.inputs.map((input) => (
          <Row key={input.label} label={input.label} value={input.value} />
        ))}
      </SurfaceCard>

      <SectionHeader title="Baseline" />
      <SurfaceCard>
        <Row
          label="Historical baseline"
          value={formatPredictionMinutes(data.historicalBaselineMinutes)}
        />
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Mean productive study time over the observation window.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Model" />
      <SurfaceCard>
        <Row label="Candidate" value={`${data.modelName} ${data.modelVersion}`} />
        <Row label="Window" value={`${data.observationWindowDays} days`} />
        <Row label="Sample size" value={`${data.sampleSize}`} />
      </SurfaceCard>

      <SectionHeader title="Uncertainty" />
      <SurfaceCard>
        <Row label="Band" value={`±${data.uncertaintyMinutes} min`} />
      </SurfaceCard>

      <SectionHeader title="Evaluation" />
      <SurfaceCard>
        <Row label="MAE" value={`${data.evaluationMaeMinutes} min`} />
        <Row label="RMSE" value={`${data.evaluationRmseMinutes} min`} />
        <Row label="R²" value={String(data.evaluationR2)} />
      </SurfaceCard>

      <SectionHeader title="Evidence" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Features: {data.features.join(', ')}
        </ThemedText>
        <ThemedButton
          label="Open evidence"
          variant="outline"
          onPress={() => router.push('/(app)/evidence')}
        />
      </SurfaceCard>

      <SectionHeader title="Limitations" />
      <SurfaceCard>
        {data.limitations.map((item) => (
          <ThemedText
            key={item}
            themeProgress={themeProgress}
            colorKey="textSecondary"
            style={styles.body}
          >
            • {item}
          </ThemedText>
        ))}
      </SurfaceCard>

      <ThemedButton
        label={techOpen ? 'Hide technical details' : 'Show technical details'}
        variant="outline"
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setTechOpen((v) => !v);
        }}
      />
      {techOpen ? (
        <SurfaceCard>
          <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.kicker}>
            For technically curious users
          </ThemedText>
          <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
            Mock evaluation uses chronological holdout. Feature set mirrors the evidence panel.
            Residual MAE informs the uncertainty band shown above. This is not live inference.
          </ThemedText>
        </SurfaceCard>
      ) : null}

      <ThemedButton label="What if?" onPress={() => router.push('/(app)/scenario')} />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { themeProgress } = useAppTheme();
  return (
    <View style={styles.row}>
      <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.rowLabel}>
        {label}
      </ThemedText>
      <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 10 },
  kicker: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: { fontFamily: 'Inter_400Regular', fontSize: 15 },
  value: { fontFamily: 'DotGothic16_400Regular', fontSize: 36, letterSpacing: 1 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  rowLabel: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
  rowValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, flex: 1, textAlign: 'right' },
});
