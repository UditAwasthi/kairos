import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import type {
  AskMessage,
  AskSource,
  Memory,
  ProcessingJob,
  ProcessingStep,
  SearchResult,
  SourceType,
} from '../../types';
import { SOURCE_TYPE_LABELS } from '../../services';
import { AURORA_TONES, AuroraTone, auroraToneColors } from '../../theme';
import { GlassPanel } from './Glass';
import { Badge } from './MetricCard';
import { SurfaceCard } from './SectionHeader';

export function TopicChip({
  label,
  onPress,
  selected,
  tone = 'frost',
}: {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  tone?: AuroraTone;
}) {
  const { colors, spacing, radius } = useAppTheme();
  const palette = auroraToneColors(colors, tone);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{
        paddingHorizontal: spacing['3'] + 2,
        paddingVertical: spacing['2'],
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: selected ? palette.accent : `${palette.accent}44`,
        backgroundColor: selected ? palette.accent : palette.tint,
      }}
    >
      <ThemedText
        colorKey={selected ? 'inverseText' : 'text'}
        style={[styles.chipLabel, !selected && { color: palette.accent }]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function toneForIndex(index: number): AuroraTone {
  return AURORA_TONES[index % AURORA_TONES.length]!;
}

export function SourceTypeLabel({ type }: { type: SourceType }) {
  return (
    <ThemedText colorKey="textMuted" style={styles.kicker}>
      {SOURCE_TYPE_LABELS[type]}
    </ThemedText>
  );
}

type MemoryCardProps = {
  memory: Memory;
  onPress: () => void;
  topicNames?: string[];
};

export function MemoryCard({ memory, onPress, topicNames }: MemoryCardProps) {
  const { colors, spacing } = useAppTheme();
  const time = new Date(memory.capturedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Memory: ${memory.title}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
    >
      <SurfaceCard>
        <View style={[styles.rowBetween, { gap: spacing['2'] }]}>
          <SourceTypeLabel type={memory.sourceType} />
          {memory.favorite ? <Badge label="Saved" tone="accent" /> : null}
        </View>
        <ThemedText colorKey="text" style={styles.cardTitle}>
          {memory.title}
        </ThemedText>
        <ThemedText colorKey="textSecondary" style={styles.body} numberOfLines={3}>
          {memory.summary}
        </ThemedText>
        <View style={[styles.rowBetween, { marginTop: spacing['1'] }]}>
          <ThemedText colorKey="textMuted" style={styles.meta}>
            {time}
          </ThemedText>
          {topicNames && topicNames.length > 0 ? (
            <ThemedText colorKey="textMuted" style={styles.meta} numberOfLines={1}>
              {topicNames.slice(0, 2).join(' · ')}
            </ThemedText>
          ) : null}
        </View>
        <View style={[styles.rail, { backgroundColor: colors.accent }]} />
      </SurfaceCard>
    </Pressable>
  );
}

type TimelineMemoryItemProps = {
  memory: Memory;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
};

export function TimelineMemoryItem({
  memory,
  onPress,
  isFirst,
  isLast,
}: TimelineMemoryItemProps) {
  const { colors, spacing } = useAppTheme();
  const timeOnly = new Date(memory.capturedAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${timeOnly}, ${memory.title}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={[styles.timelineRow, { gap: spacing['3'] }]}>
        <View style={styles.spineCol}>
          <View
            style={[
              styles.spineLine,
              { backgroundColor: colors.divider, opacity: isFirst ? 0 : 1 },
            ]}
          />
          <View
            style={[
              styles.spineDot,
              {
                borderColor: colors.accent,
                backgroundColor: colors.accentGlow,
              },
            ]}
          />
          <View
            style={[
              styles.spineLine,
              {
                backgroundColor: colors.divider,
                opacity: isLast ? 0 : 1,
                flex: 1,
              },
            ]}
          />
        </View>
        <View style={[styles.timelineBody, { paddingBottom: spacing['4'] }]}>
          <ThemedText colorKey="textMuted" style={styles.time}>
            {timeOnly}
          </ThemedText>
          <ThemedText colorKey="text" style={styles.cardTitle}>
            {memory.title}
          </ThemedText>
          <ThemedText colorKey="textSecondary" style={styles.body} numberOfLines={2}>
            {memory.summary}
          </ThemedText>
          <SourceTypeLabel type={memory.sourceType} />
        </View>
      </View>
    </Pressable>
  );
}

export function SearchResultCard({
  result,
  onPress,
}: {
  result: SearchResult;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <SurfaceCard>
        <SourceTypeLabel type={result.memory.sourceType} />
        <ThemedText colorKey="text" style={styles.cardTitle}>
          {result.memory.title}
        </ThemedText>
        <ThemedText colorKey="textSecondary" style={styles.body} numberOfLines={3}>
          {result.snippet}
        </ThemedText>
        {result.matchedTopics.length > 0 ? (
          <ThemedText colorKey="textMuted" style={styles.meta}>
            {result.matchedTopics.join(' · ')}
          </ThemedText>
        ) : null}
      </SurfaceCard>
    </Pressable>
  );
}

export function EvidenceCard({
  source,
  onPress,
}: {
  source: AskSource;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Source ${source.title}`}>
      <SurfaceCard>
        <ThemedText colorKey="textMuted" style={styles.kicker}>
          Supporting memory
        </ThemedText>
        <ThemedText colorKey="text" style={styles.cardTitle}>
          {source.title}
        </ThemedText>
        <ThemedText colorKey="textSecondary" style={styles.body} numberOfLines={2}>
          {source.snippet}
        </ThemedText>
      </SurfaceCard>
    </Pressable>
  );
}

export function AskBubble({ message }: { message: AskMessage }) {
  const { spacing, radius, gradients } = useAppTheme();
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <LinearGradient
        colors={[...gradients.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          alignSelf: 'flex-end',
          maxWidth: '82%',
          borderRadius: radius.xl,
          borderBottomRightRadius: radius.sm,
          paddingHorizontal: spacing['4'],
          paddingVertical: spacing['3'],
        }}
      >
        <ThemedText colorKey="inverseText" style={[styles.body, { fontSize: 16, lineHeight: 22 }]}>
          {message.content}
        </ThemedText>
      </LinearGradient>
    );
  }

  return (
    <View style={{ alignSelf: 'stretch', gap: spacing['2'], paddingRight: spacing['2'] }}>
      <ThemedText colorKey="text" style={[styles.body, { fontSize: 16, lineHeight: 24 }]}>
        {message.content}
      </ThemedText>
      {message.insufficientEvidence ? (
        <ThemedText colorKey="accent" style={styles.meta}>
          Insufficient supporting memories
        </ThemedText>
      ) : null}
    </View>
  );
}

function stepGlyph(status: ProcessingStep['status']): string {
  if (status === 'completed') return '✓';
  if (status === 'running') return '●';
  if (status === 'failed') return '!';
  return '○';
}

export function ProcessingIndicator({ job }: { job: ProcessingJob }) {
  const { colors, spacing } = useAppTheme();
  return (
    <SurfaceCard>
      <View style={[styles.rowBetween, { marginBottom: spacing['2'] }]}>
        <ThemedText colorKey="text" style={styles.cardTitle}>
          {job.title}
        </ThemedText>
        <Badge label={job.stage} tone={job.stage === 'READY' ? 'success' : 'accent'} />
      </View>
      <SourceTypeLabel type={job.sourceType} />
      <View style={{ gap: spacing['2'], marginTop: spacing['2'] }}>
        {job.steps.map((step) => (
          <View key={step.id} style={styles.stepRow}>
            <ThemedText
              colorKey={
                step.status === 'completed'
                  ? 'success'
                  : step.status === 'running'
                    ? 'accent'
                    : 'textMuted'
              }
              style={styles.stepGlyph}
            >
              {stepGlyph(step.status)}
            </ThemedText>
            <ThemedText colorKey="textSecondary" style={styles.body}>
              {step.label}
            </ThemedText>
            <ThemedText colorKey="textMuted" style={styles.meta}>
              {step.status}
            </ThemedText>
          </View>
        ))}
      </View>
      <View style={[styles.rail, { backgroundColor: colors.accent }]} />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  chipLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  kicker: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    letterSpacing: 0.1,
  },
  time: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 2,
    borderRadius: 1,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  spineCol: {
    width: 16,
    alignItems: 'center',
  },
  spineLine: {
    width: 1,
    flexGrow: 0,
    minHeight: 8,
  },
  spineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    marginVertical: 2,
  },
  timelineBody: {
    flex: 1,
    gap: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 28,
  },
  stepGlyph: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    width: 16,
    textAlign: 'center',
  },
});
