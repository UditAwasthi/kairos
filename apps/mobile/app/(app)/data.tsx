import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import { privacyService } from '../../services';

export default function DataScreen() {
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onExport = async () => {
    setBusy(true);
    try {
      const result = await privacyService.exportData();
      setMessage(result.message);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = () => {
    Alert.alert(
      'Delete data?',
      'This demo records a deletion request locally. Server-side deletion is not available yet.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm delete request',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                const result = await privacyService.requestDeletion();
                setMessage(result.message);
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader title="Export" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Request an export of recorded observations. Download delivery requires the backend privacy
          API.
        </ThemedText>
      </SurfaceCard>
      <ThemedButton
        label={busy ? 'Working…' : 'Export data'}
        disabled={busy}
        variant="outline"
        onPress={() => void onExport()}
      />

      <SectionHeader title="Delete" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Deletion requires confirmation. This frontend demo does not permanently erase cloud data
          because the privacy backend is not connected yet.
        </ThemedText>
      </SurfaceCard>
      <ThemedButton label="Delete data" disabled={busy} onPress={onDelete} />

      <SectionHeader title="AI / data controls" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Current builds use mock analytics and predictions only. When real models are enabled, model
          usage toggles will appear here.
        </ThemedText>
      </SurfaceCard>

      {message ? (
        <SurfaceCard>
          <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.body}>
            {message}
          </ThemedText>
        </SurfaceCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
});
