import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import { BehaviorEvent, EventType, Prediction, Recommendation, Goal } from '../../types';
import { EVENT_TYPE_LABELS } from '../../services/mock/store';
import { formatMinutes } from '../../services/utils';
import { Badge, ProgressBar, evidenceLabel } from './MetricCard';
import { SurfaceCard } from './SectionHeader';
import { formatPredictionMinutes } from '../../services';

function eventSubtitle(event: BehaviorEvent): string {
  const meta = event.meta as Record<string, unknown>;
  switch (event.type) {
    case 'study':
      return `${formatMinutes(meta.durationMinutes as number)} · productivity ${meta.productivity}/5`;
    case 'sleep':
      return `${formatMinutes(meta.durationMinutes as number)} · quality ${meta.quality}/5`;
    case 'exercise':
      return `${meta.exerciseType} · ${formatMinutes(meta.durationMinutes as number)} · ${meta.intensity}`;
    case 'task':
      return `${meta.title} · ${meta.completed ? 'Done' : 'Open'} · ${meta.category}`;
    case 'habit':
      return `${meta.habitName} · ${meta.completed ? 'Completed' : 'Missed'}`;
    case 'productivity':
      return `Score ${meta.score}/5`;
    case 'mood':
      return `${meta.label} (${meta.score}/5)`;
    case 'screen_time':
      return `${formatMinutes(meta.durationMinutes as number)} · ${meta.category}`;
    case 'spending':
      return `${meta.currency} ${meta.amount} · ${meta.category}`;
    case 'observation':
      return String(meta.text);
    default:
      return EVENT_TYPE_LABELS[event.type as EventType];
  }
}

type TimelineItemProps = {
  event: BehaviorEvent;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
};

const TYPE_MARK: Partial<Record<EventType, 'accent' | 'strong'>> = {
  study: 'accent',
  observation: 'accent',
  productivity: 'strong',
  sleep: 'strong',
};

export function TimelineItem({ event, onPress, isFirst, isLast }: TimelineItemProps) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const mark = TYPE_MARK[event.type] ?? 'strong';
  const railColor = mark === 'accent' ? colors.accent : colors.borderActive;
  const timeOnly = new Date(event.timestamp).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={[styles.row, { gap: spacing['3'] }]}>
        <View style={styles.spineCol}>
          <View
            style={[
              styles.spineLine,
              {
                backgroundColor: colors.divider,
                opacity: isFirst ? 0 : 1,
              },
            ]}
          />
          <View
            style={[
              styles.spineDot,
              {
                borderColor: railColor,
                backgroundColor: mark === 'accent' ? colors.accentGlow : colors.surfaceElevated,
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

        <View
          style={[
            styles.card,
            {
              flex: 1,
              marginBottom: spacing['2'],
              borderRadius: radius.lg,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              paddingVertical: spacing['3'],
              paddingHorizontal: spacing['3'],
              gap: spacing['2'],
            },
          ]}
        >
          <View style={styles.itemTop}>
            <Badge
              label={EVENT_TYPE_LABELS[event.type]}
              tone={mark === 'accent' ? 'accent' : 'neutral'}
            />
            <ThemedText colorKey="textMuted" style={styles.time}>
              {timeOnly}
            </ThemedText>
          </View>
          <ThemedText
            colorKey="text"
            style={[
              styles.itemTitle,
              {
                fontSize: typography.bodySmall.size + 1,
                letterSpacing: -0.2,
              },
            ]}
          >
            {event.title}
          </ThemedText>
          <ThemedText colorKey="textSecondary" style={styles.itemSub} numberOfLines={2}>
            {eventSubtitle(event)}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

type PredictionCardProps = {
  prediction: Prediction;
  onPress?: () => void;
};

export function PredictionCard({ prediction, onPress }: PredictionCardProps) {
  const { colors, typography, spacing } = useAppTheme();

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <SurfaceCard elevated>
        <View style={{ gap: spacing['1'] }}>
          <ThemedText colorKey="textMuted" style={styles.kicker}>
            Model estimate
          </ThemedText>
          <ThemedText colorKey="text" style={styles.predTitle}>
            {prediction.title}
          </ThemedText>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: spacing['2'],
            marginTop: spacing['2'],
          }}
        >
          <ThemedText
            colorKey="text"
            style={[
              styles.predValue,
              { color: colors.accent },
            ]}
          >
            {formatPredictionMinutes(prediction.estimatedMinutes)}
          </ThemedText>
          <ThemedText colorKey="textMuted" style={styles.predUnit}>
            min
          </ThemedText>
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: spacing['3'],
          }}
        />
        <ThemedText colorKey="textSecondary" style={styles.predMeta}>
          Uncertainty ±{prediction.uncertaintyMinutes}m · Baseline{' '}
          {formatPredictionMinutes(prediction.historicalBaselineMinutes)}
        </ThemedText>
      </SurfaceCard>
    </Pressable>
  );
}

type RecommendationCardProps = {
  recommendation: Recommendation;
  onHelpful: () => void;
  onNotHelpful: () => void;
};

export function RecommendationCard({
  recommendation,
  onHelpful,
  onNotHelpful,
}: RecommendationCardProps) {
  const { colors, spacing, radius } = useAppTheme();

  return (
    <SurfaceCard>
      <View style={{ gap: spacing['2'] }}>
        <Badge label={evidenceLabel(recommendation.evidenceStrength)} tone="accent" />
        <ThemedText colorKey="text" style={styles.recBody}>
          {recommendation.recommendation}
        </ThemedText>
        <ThemedText colorKey="textSecondary" style={styles.recEvidence}>
          {recommendation.supportingEvidence}
        </ThemedText>
        <ThemedText colorKey="textMuted" style={styles.recMeta}>
          {recommendation.dataWindow} · {recommendation.action}
        </ThemedText>
      </View>
      <View
        style={{
          height: 1,
          backgroundColor: colors.divider,
          marginVertical: spacing['3'],
        }}
      />
      <View style={styles.feedbackRow}>
        <Pressable
          onPress={onHelpful}
          style={[
            styles.feedbackBtn,
            {
              backgroundColor:
                recommendation.feedback === 'helpful'
                  ? colors.text
                  : 'transparent',
              borderColor:
                recommendation.feedback === 'helpful'
                  ? colors.text
                  : colors.border,
            },
          ]}
        >
          <ThemedText
            colorKey={
              recommendation.feedback === 'helpful' ? 'inverseText' : 'text'
            }
            style={styles.feedbackLabel}
          >
            {recommendation.feedback === 'helpful' ? '✓ Helpful' : 'Helpful'}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={onNotHelpful}
          style={[
            styles.feedbackBtn,
            {
              backgroundColor:
                recommendation.feedback === 'not_helpful'
                  ? colors.text
                  : 'transparent',
              borderColor:
                recommendation.feedback === 'not_helpful'
                  ? colors.text
                  : colors.border,
            },
          ]}
        >
          <ThemedText
            colorKey={
              recommendation.feedback === 'not_helpful'
                ? 'inverseText'
                : 'text'
            }
            style={styles.feedbackLabel}
          >
            {recommendation.feedback === 'not_helpful'
              ? '✓ Not helpful'
              : 'Not helpful'}
          </ThemedText>
        </Pressable>
      </View>
    </SurfaceCard>
  );
}

type GoalCardProps = {
  goal: Goal;
  onPress: () => void;
};

export function GoalCard({ goal, onPress }: GoalCardProps) {
  const { colors, typography, spacing } = useAppTheme();
  const progress = goal.target === 0 ? 0 : goal.current / goal.target;
  const unitLabel =
    goal.unit === 'hours' ? 'h' : goal.unit === 'min' ? 'm' : ` ${goal.unit}`;

  return (
    <Pressable onPress={onPress}>
      <SurfaceCard>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing['2'],
          }}
        >
          <ThemedText colorKey="text" style={styles.goalTitle}>
            {goal.title}
          </ThemedText>
          <ThemedText colorKey="textMuted" style={styles.goalPercent}>
            {Math.round(progress * 100)}%
          </ThemedText>
        </View>
        <ProgressBar progress={progress} />
        <ThemedText colorKey="textSecondary" style={styles.goalMeta}>
          {goal.current}
          {unitLabel} / {goal.target}
          {unitLabel} · due {new Date(goal.deadline).toLocaleDateString()}
        </ThemedText>
      </SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  spineCol: {
    width: 14,
    alignItems: 'center',
  },
  spineLine: {
    width: StyleSheet.hairlineWidth,
    minHeight: 8,
  },
  spineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    marginVertical: 2,
  },
  card: {
    borderWidth: 1,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  itemTitle: {
    fontFamily: 'Inter_600SemiBold',
  },
  itemSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  kicker: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  predTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  predValue: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 40,
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  predUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  predMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    letterSpacing: -0.1,
  },
  recBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  recEvidence: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  recMeta: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1,
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 10,
  },
  feedbackBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  feedbackLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  goalTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.2,
    flex: 1,
  },
  goalPercent: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 13,
  },
  goalMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 8,
    letterSpacing: -0.1,
  },
});