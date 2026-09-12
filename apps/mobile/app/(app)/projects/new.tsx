import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedInput } from '../../../components/ui/ThemedInput';
import { ApiError, createProject } from '../../../lib/api';
import { useAppTheme } from '../../../providers/ThemeProvider';

export default function NewProjectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Project name is required.');
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
      setError(err instanceof ApiError ? err.message : 'Could not create project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader title="New project" subtitle="Name a workspace for related observations" />
      <SurfaceCard>
        <ThemedText colorKey="textMuted" style={styles.label}>
          Name
        </ThemedText>
        <ThemedInput
          value={name}
          onChangeText={setName}
          placeholder="Final Year Project"
          accessibilityLabel="Project name"
          maxLength={120}
        />
        <ThemedText colorKey="textMuted" style={[styles.label, styles.spaced]}>
          Description (optional)
        </ThemedText>
        <ThemedInput
          value={description}
          onChangeText={setDescription}
          placeholder="Everything related to the project"
          accessibilityLabel="Project description"
          multiline
          style={{ minHeight: 88, textAlignVertical: 'top' }}
          maxLength={2000}
        />
      </SurfaceCard>

      {error ? (
        <ThemedText colorKey="text" style={[styles.error, { color: colors.accent }]}>
          {error}
        </ThemedText>
      ) : null}

      <ThemedButton
        label={saving ? 'Saving…' : 'Save project'}
        disabled={saving || name.trim().length === 0}
        onPress={() => {
          void save().catch((err) => {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20, gap: 12 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginBottom: 6 },
  spaced: { marginTop: 14 },
  error: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
