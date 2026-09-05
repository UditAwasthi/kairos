import { useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PredictionCard, TimelineItem } from '../../../components/ui/Cards';
import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { InsightCard, MetricCard } from '../../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedText } from '../../../components/ThemedText';
import { useAsync } from '../../../hooks/useAsync';
import { dashboardService, formatPredictionMinutes } from '../../../services';
import { evidenceLabel } from '../../../components/ui/MetricCard';
import { useAppTheme } from '../../../providers/ThemeProvider';

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();
  const { data, error, loading, reload } = useAsync(() => dashboardService.getSummary(), []);

  const name =
    user?.firstName ||
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'there';

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error || !data) {
    return <ErrorState title="Unable to load home" message={error ?? undefined} onRetry={reload} />;
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.date}>
            {dateLabel}
          </ThemedText>
          <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.greeting}>
            {greetingForNow()}, {name}
          </ThemedText>
          <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.lede}>
            Here's what your recent data says.
          </ThemedText>
        </View>
        <Pressable
          onPress={() => router.push('/(app)/(tabs)/profile')}
          accessibilityLabel="Open profile"
        >
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.avatarLetter}>
                {name.slice(0, 1).toUpperCase()}
              </ThemedText>
            </View>
          )}
        </Pressable>
      </View>

      <SectionHeader title="Summary" subtitle="Last 7 days" />
      <View style={styles.metrics}>
        {data.metrics.map((m) => {
          let display = String(m.value);
          if (m.unit === '/5') display = `${m.value}/5`;
          else if (m.unit === '%') display = `${m.value}%`;
          else if (m.unit.includes('min')) display = `${m.value}m`;
          else if (m.unit.includes('h')) display = `${m.value}h`;
          return (
            <MetricCard
              key={m.key}
              label={m.label}
              value={display}
              hint={m.unit.includes('avg') || m.unit.includes('wk') ? m.unit : undefined}
            />
          );
        })}
      </View>

      {data.predictionPreview ? (
        <>
          <SectionHeader
            title="Prediction"
            actionLabel="View"
            onAction={() => router.push(`/(app)/prediction/${data.predictionPreview!.id}`)}
          />
          <PredictionCard
            prediction={data.predictionPreview}
            onPress={() => router.push(`/(app)/prediction/${data.predictionPreview!.id}`)}
          />
        </>
      ) : null}

      {data.scenarioPreview ? (
        <>
          <SectionHeader
            title="Scenario"
            actionLabel="Simulate"
            onAction={() => router.push('/(app)/scenario')}
          />
          <SurfaceCard>
            <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.kicker}>
              Model-based scenario estimate
            </ThemedText>
            <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.cardTitle}>
              {data.scenarioPreview.label}
            </ThemedText>
            <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
              Current {formatPredictionMinutes(data.scenarioPreview.currentMinutes)} → Scenario{' '}
              {formatPredictionMinutes(data.scenarioPreview.scenarioMinutes)}
            </ThemedText>
          </SurfaceCard>
        </>
      ) : null}

      <SectionHeader
        title="Evidence"
        actionLabel="Inspect"
        onAction={() => router.push('/(app)/evidence')}
      />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.cardTitle}>
          {data.evidencePreview.sampleSize} observations · {data.evidencePreview.completeness}%
          completeness
        </ThemedText>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Inspect features, baseline, evaluation, and limitations.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader
        title="Recent patterns"
        actionLabel="Explore"
        onAction={() => router.push('/(app)/patterns')}
      />
      <View style={styles.stack}>
        {data.recentPatterns.map((p) => (
          <InsightCard
            key={p.id}
            title={p.title}
            body={p.observation}
            meta={p.supportingMetric}
            badge={evidenceLabel(p.evidenceStrength)}
          />
        ))}
      </View>

      <SectionHeader
        title="Recent activity"
        actionLabel="Timeline"
        onAction={() => router.push('/(app)/(tabs)/timeline')}
      />
      <View style={styles.stack}>
        {data.recentEvents.map((event) => (
          <TimelineItem
            key={event.id}
            event={event}
            onPress={() => router.push(`/(app)/event/${event.id}`)}
          />
        ))}
      </View>

      <View style={styles.ctaStack}>
        <ThemedButton
          label="Explore your patterns"
          onPress={() => router.push('/(app)/patterns')}
        />
        <ThemedButton
          label="View prediction"
          variant="outline"
          onPress={() => router.push('/(app)/(tabs)/predict')}
        />
        <ThemedButton
          label="Record observation"
          variant="outline"
          onPress={() => router.push('/(app)/event/add')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  date: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  greeting: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 26,
    letterSpacing: 1,
  },
  lede: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  stack: {
    gap: 10,
    marginBottom: 12,
  },
  kicker: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  ctaStack: {
    gap: 10,
    marginTop: 12,
  },
});
