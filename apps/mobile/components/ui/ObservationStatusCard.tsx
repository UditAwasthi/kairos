import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../ThemedText';
import {
  formatObservationReadyTime,
  isProcessingObservationStatus,
  observationStageLabel,
  observationStatusHeadline,
  type ApiObservation,
} from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';

type Props = {
  observation: ApiObservation;
  onPress: () => void;
  onRetry?: () => void;
  retrying?: boolean;
};

export function ObservationStatusCard({
  observation,
  onPress,
  onRetry,
  retrying,
}: Props) {
  const { colors } = useAppTheme();
  const processing = isProcessingObservationStatus(observation.status);
  const failed = observation.status === 'FAILED';
  const ready = observation.status === 'COMPLETED';
  const glyph = ready ? '✓' : failed ? '⚠' : '⟳';
  const headline = observationStatusHeadline(observation.status);
  const detail = ready
    ? formatObservationReadyTime(
        observation.processedAt || observation.updatedAt,
      )
    : failed
      ? onRetry
        ? 'Tap to retry'
        : observation.processingError || 'Tap for details'
      : observationStageLabel(observation);

  return (
    <Pressable
      onPress={failed && onRetry ? onRetry : onPress}
      accessibilityRole="button"
      accessibilityLabel={`${observation.filename}, ${headline}`}
      style={({ pressed }) => [
        styles.row,
        {
          opacity: pressed ? 0.85 : 1,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <ThemedText colorKey="text" style={styles.title} numberOfLines={1}>
        {observation.filename}
      </ThemedText>
      <View style={styles.statusRow}>
        <ThemedText
          colorKey={ready ? 'success' : failed ? 'accent' : 'textMuted'}
          style={styles.glyph}
        >
          {glyph}
        </ThemedText>
        <View style={styles.statusCopy}>
          <ThemedText
            colorKey={ready ? 'success' : failed ? 'accent' : 'text'}
            style={styles.headline}
          >
            {retrying ? 'Retrying…' : headline}
          </ThemedText>
          <ThemedText colorKey="textMuted" style={styles.detail}>
            {processing && !retrying ? detail : retrying ? 'Processing…' : detail}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  glyph: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 1 },
  statusCopy: { flex: 1, gap: 2 },
  headline: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  detail: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
});
