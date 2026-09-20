import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { ThemedText } from '../../../components/ThemedText';
import { GlassPanel } from '../../../components/ui/Glass';
import { SoftPage } from '../../../components/ui/SoftScreen';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedInput } from '../../../components/ui/ThemedInput';
import { ApiError, createProject } from '../../../lib/api';
import { useAppTheme } from '../../../providers/ThemeProvider';

export default function NewProjectScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new ApiError('You must be signed in.', 401);
      const project = await createProject({
        token,
        name: trimmed,
        description: description.trim() || null,
      });
      router.replace(`/(app)/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SoftPage>
      <GlassPanel contentStyle={styles.form}>
        <ThemedInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          accessibilityLabel="Project name"
          maxLength={120}
        />
        <ThemedInput
          value={description}
          onChangeText={setDescription}
          placeholder="Note (optional)"
          accessibilityLabel="Project description"
          multiline
          style={styles.noteInput}
          maxLength={2000}
        />
      </GlassPanel>

      {error ? (
        <ThemedText colorKey="text" style={[styles.error, { color: colors.accent }]}>
          {error}
        </ThemedText>
      ) : null}

      <ThemedButton
        label={saving ? '…' : 'Save'}
        disabled={saving || name.trim().length === 0}
        onPress={() => {
          void save().catch((err) => {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
          });
        }}
      />
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  noteInput: { minHeight: 72, textAlignVertical: 'top' },
  error: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
