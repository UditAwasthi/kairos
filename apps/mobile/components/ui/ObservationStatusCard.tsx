import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../ThemedText';
import {
  formatObservationReadyTime,
  isProcessingObservationStatus,
  observationStageLabel,
  type ApiObservation,
} from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';
import { GlassPanel } from './Glass';

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

  const meta = retrying
    ? '…'
    : ready
      ? formatObservationReadyTime(observation.processedAt || observation.updatedAt)
      : failed
        ? 'Failed'
        : observationStageLabel(observation);

  const icon: React.ComponentProps<typeof Feather>['name'] = ready
    ? 'check'
    : failed
      ? 'alert-circle'
      : 'loader';

  return (
    <Pressable
      onPress={failed && onRetry ? onRetry : onPress}
      accessibilityRole="button"
      accessibilityLabel={observation.filename}
      style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
    >
      <GlassPanel padded={false} contentStyle={styles.inner}>
        <View style={[styles.icon, { backgroundColor: colors.accentGlow }]}>
          <Feather
            name={icon}
            size={16}
            color={ready ? colors.success : failed ? colors.error : colors.accent}
          />
        </View>
        <View style={styles.copy}>
          <ThemedText colorKey="text" style={styles.title} numberOfLines={1}>
            {observation.filename}
          </ThemedText>
          <ThemedText colorKey="textMuted" style={styles.meta} numberOfLines={1}>
            {observation.sourceLabel ? `${observation.sourceLabel} · ${meta}` : meta}
          </ThemedText>
        </View>
        {processing ? (
          <View style={[styles.dot, { backgroundColor: colors.accent }]} />
        ) : null}
      </GlassPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  title: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    letterSpacing: -0.1,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
