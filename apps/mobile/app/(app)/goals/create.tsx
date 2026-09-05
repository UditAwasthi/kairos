import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedInput } from '../../../components/ui/ThemedInput';
import { ThemedText } from '../../../components/ThemedText';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { goalsService } from '../../../services';

export default function CreateGoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { spacing } = useAppTheme();
  const [title, setTitle] = useState('');
  const [metricKey, setMetricKey] = useState('study_minutes');
  const [target, setTarget] = useState('1200');
  const [unit, setUnit] = useState('min');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    const targetNum = Number(target);
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!Number.isFinite(targetNum) || targetNum <= 0) {
      setError('Target must be a positive number.');
      return;
    }
    if (!deadline) {
      setError('Deadline is required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const goal = await goalsService.create({
        title: title.trim(),
        metricKey: metricKey.trim() || 'custom',
        target: targetNum,
        unit: unit.trim() || 'units',
        deadline: new Date(`${deadline}T23:59:00`).toISOString(),
      });
      router.replace(`/(app)/goals/${goal.id}`);
    } catch {
      setError('Unable to create goal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { padding: spacing['5'], gap: spacing['3'], paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Title">
          <ThemedInput value={title} onChangeText={setTitle} placeholder="Study 20 hours this week" />
        </Field>
        <Field label="Metric key">
          <ThemedInput value={metricKey} onChangeText={setMetricKey} placeholder="study_minutes" />
        </Field>
        <Field label="Target">
          <ThemedInput
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
            placeholder="1200"
          />
        </Field>
        <Field label="Unit">
          <ThemedInput value={unit} onChangeText={setUnit} placeholder="min" />
        </Field>
        <Field label="Deadline (YYYY-MM-DD)">
          <ThemedInput value={deadline} onChangeText={setDeadline} placeholder="2026-03-12" />
        </Field>
        {error ? (
          <ThemedText colorKey="error" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
        <ThemedButton
          label={saving ? 'Creating…' : 'Create goal'}
          disabled={saving}
          onPress={() => void onSubmit()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText colorKey="textMuted" style={styles.label}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {},
  field: { gap: 6 },
  label: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  error: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
});
