import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedInput } from '../../../components/ui/ThemedInput';
import { ThemedText } from '../../../components/ThemedText';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { eventsService } from '../../../services';
import { EVENT_TYPE_LABELS } from '../../../services/mock/store';
import { CreateEventInput, EventMetaMap, EventType } from '../../../types';

const TYPES: EventType[] = [
  'study',
  'sleep',
  'exercise',
  'habit',
  'task',
  'productivity',
  'mood',
  'screen_time',
  'spending',
  'observation',
];

function defaultMeta(type: EventType): EventMetaMap[EventType] {
  switch (type) {
    case 'study':
      return { durationMinutes: 60, subject: '', productivity: 3, notes: '' };
    case 'sleep':
      return {
        sleepTime: new Date(Date.now() - 8 * 3600000).toISOString(),
        wakeTime: new Date().toISOString(),
        quality: 3,
        durationMinutes: 480,
      };
    case 'exercise':
      return { exerciseType: 'Run', durationMinutes: 30, intensity: 'moderate' };
    case 'habit':
      return { habitName: '', completed: true };
    case 'task':
      return { title: '', completed: false, category: 'Personal' };
    case 'productivity':
      return { score: 3, notes: '' };
    case 'mood':
      return { score: 3, label: 'Okay', notes: '' };
    case 'screen_time':
      return { durationMinutes: 60, category: 'Social' };
    case 'spending':
      return { amount: 0, currency: 'USD', category: 'Food', notes: '' };
    case 'observation':
      return { text: '' };
  }
}

export default function AddEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeProgress, isLight } = useAppTheme();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const [type, setType] = useState<EventType>('study');
  const [title, setTitle] = useState('');
  const [meta, setMeta] = useState<EventMetaMap[EventType]>(defaultMeta('study'));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) return;
    void eventsService.get(String(editId)).then((event) => {
      setType(event.type);
      setTitle(event.title);
      setMeta(event.meta);
    });
  }, [editId]);

  const fields = useMemo(() => meta as Record<string, unknown>, [meta]);

  const setField = (key: string, value: unknown) => {
    setMeta((prev) => ({ ...(prev as object), [key]: value }) as EventMetaMap[EventType]);
  };

  const validate = (): string | null => {
    if (type === 'study') {
      const m = meta as EventMetaMap['study'];
      if (!m.subject.trim()) return 'Subject is required.';
      if (m.durationMinutes <= 0) return 'Duration must be greater than 0.';
      if (m.productivity < 1 || m.productivity > 5) return 'Productivity must be 1–5.';
    }
    if (type === 'sleep') {
      const m = meta as EventMetaMap['sleep'];
      if (m.quality < 1 || m.quality > 5) return 'Quality must be 1–5.';
    }
    if (type === 'exercise') {
      const m = meta as EventMetaMap['exercise'];
      if (!m.exerciseType.trim()) return 'Exercise type is required.';
      if (m.durationMinutes <= 0) return 'Duration must be greater than 0.';
    }
    if (type === 'task') {
      const m = meta as EventMetaMap['task'];
      if (!m.title.trim()) return 'Task title is required.';
    }
    if (type === 'habit') {
      const m = meta as EventMetaMap['habit'];
      if (!m.habitName.trim()) return 'Habit name is required.';
    }
    if (type === 'observation') {
      const m = meta as EventMetaMap['observation'];
      if (!m.text.trim()) return 'Observation text is required.';
    }
    if (type === 'mood' || type === 'productivity') {
      const score = (meta as { score: number }).score;
      if (score < 1 || score > 5) return 'Score must be 1–5.';
    }
    if (type === 'spending') {
      const m = meta as EventMetaMap['spending'];
      if (m.amount < 0) return 'Amount cannot be negative.';
    }
    return null;
  };

  const onSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const input: CreateEventInput = {
        type,
        timestamp: new Date().toISOString(),
        title: title.trim() || EVENT_TYPE_LABELS[type],
        meta,
      };
      if (editId) {
        await eventsService.update(String(editId), input);
      } else {
        await eventsService.create(input);
      }
      router.back();
    } catch {
      setError('Unable to save event. Please try again.');
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.label}>
          Event type
        </ThemedText>
        <View style={styles.typeGrid}>
          {TYPES.map((t) => {
            const active = t === type;
            return (
              <Pressable
                key={t}
                onPress={() => {
                  setType(t);
                  setMeta(defaultMeta(t));
                  setTitle('');
                }}
                style={[
                  styles.typeChip,
                  {
                    borderColor: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)',
                    backgroundColor: active ? (isLight ? '#111' : '#fff') : 'transparent',
                  },
                ]}
              >
                <ThemedText
                  themeProgress={themeProgress}
                  colorKey={active ? 'buttonPressedText' : 'text'}
                  style={styles.typeLabel}
                >
                  {EVENT_TYPE_LABELS[t]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.label}>
          Title (optional)
        </ThemedText>
        <ThemedInput value={title} onChangeText={setTitle} placeholder="Title" />

        {Object.keys(fields).map((key) => {
          const value = fields[key];
          if (typeof value === 'boolean') {
            return (
              <Pressable
                key={key}
                onPress={() => setField(key, !value)}
                style={styles.boolRow}
              >
                <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.fieldLabel}>
                  {key}: {value ? 'Yes' : 'No'}
                </ThemedText>
              </Pressable>
            );
          }
          return (
            <View key={key} style={styles.field}>
              <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.label}>
                {key}
              </ThemedText>
              <ThemedInput
                value={String(value ?? '')}
                onChangeText={(text) => {
                  if (typeof value === 'number') {
                    const n = Number(text);
                    setField(key, Number.isFinite(n) ? n : 0);
                  } else {
                    setField(key, text);
                  }
                }}
                keyboardType={typeof value === 'number' ? 'decimal-pad' : 'default'}
                placeholder={key}
              />
            </View>
          );
        })}

        {error ? (
          <ThemedText colorKey="error" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        <ThemedButton
          label={saving ? 'Saving…' : editId ? 'Save changes' : 'Create event'}
          disabled={saving}
          onPress={() => void onSubmit()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, gap: 10 },
  label: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  typeLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  boolRow: { minHeight: 44, justifyContent: 'center' },
  error: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
});
