import { useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, StyleSheet, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedText } from '../../components/ThemedText';
import { useAsync } from '../../hooks/useAsync';
import { useAppTheme } from '../../providers/ThemeProvider';
import { evidenceService } from '../../services';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function EvidenceScreen() {
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();
  const [open, setOpen] = useState(false);
  const { data, error, loading, reload } = useAsync(() => evidenceService.get(), []);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error || !data) {
    return <ErrorState title="Unable to load evidence" message={error ?? undefined} onRetry={reload} />;
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.lede}>
        Kairos should not feel like a black box. Inspect what the estimate is based on.
      </ThemedText>

      <SectionHeader title="Observation window" />
      <SurfaceCard>
        <Row label="Window" value={`${data.observationWindowDays} days`} />
        <Row label="Sample size" value={`${data.sampleSize}`} />
      </SurfaceCard>

      <SectionHeader title="Features" />
      <SurfaceCard>
        {data.features.map((feature) => (
          <ThemedText
            key={feature}
            themeProgress={themeProgress}
            colorKey="text"
            style={styles.feature}
          >
            • {feature}
          </ThemedText>
        ))}
      </SurfaceCard>

      <SectionHeader title="Baseline & model" />
      <SurfaceCard>
        <Row label="Baseline" value={data.baseline} />
        <Row label="Candidate model" value={data.candidateModel} />
      </SurfaceCard>

      <SectionHeader title="Evaluation" />
      <SurfaceCard>
        <Row label="MAE" value={`${data.evaluation.mae} min`} />
        <Row label="RMSE" value={`${data.evaluation.rmse} min`} />
        <Row label="R²" value={String(data.evaluation.r2)} />
        <Row label="Uncertainty" value={`±${data.uncertaintyMinutes} min`} />
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
        label={open ? 'Hide calculation notes' : 'How this was calculated'}
        variant="outline"
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen((v) => !v);
        }}
      />
      {open ? (
        <SurfaceCard>
          {data.calculationNotes.map((note) => (
            <ThemedText
              key={note}
              themeProgress={themeProgress}
              colorKey="textSecondary"
              style={styles.body}
            >
              • {note}
            </ThemedText>
          ))}
        </SurfaceCard>
      ) : null}
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
  lede: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  feature: { fontFamily: 'Inter_400Regular', fontSize: 14, paddingVertical: 2 },
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
