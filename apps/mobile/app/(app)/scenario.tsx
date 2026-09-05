import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stepper } from '../../components/ui/Paywall';
import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedText } from '../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { useAppTheme } from '../../providers/ThemeProvider';
import { formatPredictionMinutes, scenariosService } from '../../services';
import { ScenarioInput, ScenarioResult } from '../../types';
import { round } from '../../services/utils';

const INITIAL: ScenarioInput = {
  sleepHours: 7.5,
  studyHours: 2,
  exerciseMinutes: 30,
  taskCompletionRate: 0.75,
};

export default function ScenarioScreen() {
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();
  const [inputs, setInputs] = useState<ScenarioInput>(INITIAL);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await scenariosService.simulate(inputs);
      setResult(next);
    } catch {
      setError('Unable to run scenario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.lede}>
        Adjust measurable inputs to explore a model-based scenario estimate.
      </ThemedText>

      <SectionHeader title="Inputs" />
      <SurfaceCard>
        <Stepper
          label="Sleep duration"
          valueLabel={`${inputs.sleepHours.toFixed(1)}h`}
          onDecrement={() =>
            setInputs((s) => ({ ...s, sleepHours: round(Math.max(4, s.sleepHours - 0.5), 1) }))
          }
          onIncrement={() =>
            setInputs((s) => ({ ...s, sleepHours: round(Math.min(10, s.sleepHours + 0.5), 1) }))
          }
        />
        <Stepper
          label="Study duration"
          valueLabel={`${inputs.studyHours.toFixed(1)}h`}
          onDecrement={() =>
            setInputs((s) => ({ ...s, studyHours: round(Math.max(0, s.studyHours - 0.5), 1) }))
          }
          onIncrement={() =>
            setInputs((s) => ({ ...s, studyHours: round(Math.min(8, s.studyHours + 0.5), 1) }))
          }
        />
        <Stepper
          label="Exercise"
          valueLabel={`${inputs.exerciseMinutes}m`}
          onDecrement={() =>
            setInputs((s) => ({
              ...s,
              exerciseMinutes: Math.max(0, s.exerciseMinutes - 5),
            }))
          }
          onIncrement={() =>
            setInputs((s) => ({
              ...s,
              exerciseMinutes: Math.min(120, s.exerciseMinutes + 5),
            }))
          }
        />
        <Stepper
          label="Task completion"
          valueLabel={`${Math.round(inputs.taskCompletionRate * 100)}%`}
          onDecrement={() =>
            setInputs((s) => ({
              ...s,
              taskCompletionRate: round(Math.max(0, s.taskCompletionRate - 0.05), 2),
            }))
          }
          onIncrement={() =>
            setInputs((s) => ({
              ...s,
              taskCompletionRate: round(Math.min(1, s.taskCompletionRate + 0.05), 2),
            }))
          }
        />
      </SurfaceCard>

      <ThemedButton
        label={loading ? 'Estimating…' : 'Run scenario'}
        disabled={loading}
        onPress={() => void run()}
      />

      {loading ? <LoadingSkeleton rows={3} /> : null}
      {error ? <ErrorState title="Scenario failed" message={error} onRetry={() => void run()} /> : null}

      {result ? (
        <>
          <SectionHeader title="Result" />
          <SurfaceCard>
            <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.kicker}>
              Model-based scenario estimate
            </ThemedText>
            <Row
              label="Current estimate"
              value={formatPredictionMinutes(result.currentEstimateMinutes)}
            />
            <Row
              label="Scenario estimate"
              value={formatPredictionMinutes(result.scenarioEstimateMinutes)}
            />
            <Row
              label="Difference"
              value={`${result.differenceMinutes >= 0 ? '+' : ''}${result.differenceMinutes}m`}
            />
            <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.note}>
              {result.disclaimer}
            </ThemedText>
          </SurfaceCard>
        </>
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
  content: { padding: 20, gap: 12 },
  lede: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  kicker: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  note: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 12,
  },
  rowLabel: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
  rowValue: { fontFamily: 'Inter_600SemiBold', fontSize: 16, flex: 1, textAlign: 'right' },
});
