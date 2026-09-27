import { useAuth, useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FLOATING_TAB_BAR_CONTENT } from '../../../components/FloatingTabBar';
import { HomeWorld } from '../../../components/home/HomeWorld';
import {
  KairosCard,
  KairosEnter,
  KairosInput,
  KairosMemoryCard,
  KairosPill,
  KairosSectionHeader,
  KairosState,
  KairosText,
} from '../../../components/ui/Kairos';
import { readQueryCache, writeQueryCache } from '../../../hooks/useAsync';
import {
  fetchDailyBrief,
  fetchDashboard,
  fetchObservations,
  fetchPredictions,
  fetchProjects,
  fetchTopics,
  type ApiObservation,
  type ApiProjectSummary,
  type ApiTopicSummary,
  type DailyBrief,
  type DashboardSummary,
  type PredictionsSummary,
} from '../../../lib/api';
import { askPrompts, noticedDiscovery } from '../../../lib/discovery';
import { homeStage, homeStageCopy } from '../../../lib/homeStage';
import { greetingParts, memoryTitle, resurfacedMemory, weekDays, worldGraph } from '../../../lib/homeSummary';
import { getCaptureSync, subscribeCaptureSync } from '../../../lib/syncStatus';
import { useAppTheme } from '../../../providers/ThemeProvider';

type HomeCache = {
  dashboard: DashboardSummary | null;
  observations: ApiObservation[];
  topics: ApiTopicSummary[];
  predictions: PredictionsSummary | null;
  brief: DailyBrief | null;
  projects: ApiProjectSummary[];
};

const HOME_CACHE = 'home-feed';

function readHomeCache(): HomeCache | null {
  const raw = readQueryCache<Partial<HomeCache>>(HOME_CACHE);
  if (!raw?.observations && !raw?.dashboard) return null;
  return {
    dashboard: raw.dashboard ?? null,
    observations: raw.observations ?? [],
    topics: raw.topics ?? [],
    predictions: raw.predictions ?? null,
    brief: raw.brief ?? null,
    projects: raw.projects ?? [],
  };
}

export default function HomeScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();

  const cached = readHomeCache();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(cached?.dashboard ?? null);
  const [observations, setObservations] = useState<ApiObservation[]>(cached?.observations ?? []);
  const [topics, setTopics] = useState<ApiTopicSummary[]>(cached?.topics ?? []);
  const [predictions, setPredictions] = useState<PredictionsSummary | null>(
    cached?.predictions ?? null,
  );
  const [brief, setBrief] = useState<DailyBrief | null>(cached?.brief ?? null);
  const [projects, setProjects] = useState<ApiProjectSummary[]>(cached?.projects ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(Boolean(cached));

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Sign in to view your home.');
      const [nextObservations, topicData, nextDashboard, nextPredictions, nextBrief, projectData] =
        await Promise.all([
          fetchObservations(token, { limit: 12 }).catch(() => [] as ApiObservation[]),
          fetchTopics({ token, limit: 20 }).catch(() => ({ items: [] as ApiTopicSummary[] })),
          fetchDashboard(token).catch(() => null),
          fetchPredictions(token).catch(() => null),
          fetchDailyBrief(token).catch(() => null),
          fetchProjects({ token, limit: 8 }).catch(() => ({ items: [] as ApiProjectSummary[] })),
        ]);
      setObservations(nextObservations);
      setTopics(topicData.items);
      setPredictions(nextPredictions);
      setBrief(nextBrief);
      setProjects(projectData.items);
      setDashboard((prev) => {
        const next = nextDashboard ?? prev;
        writeQueryCache(HOME_CACHE, {
          dashboard: next,
          observations: nextObservations,
          topics: topicData.items,
          predictions: nextPredictions,
          brief: nextBrief,
          projects: projectData.items,
        });
        return next;
      });
      const hasAnything =
        nextObservations.length > 0 ||
        Boolean(nextDashboard) ||
        topicData.items.length > 0 ||
        projectData.items.length > 0;
      hasDataRef.current = hasAnything || hasDataRef.current;
      if (!hasAnything && !nextDashboard) {
        setError('Unable to load.');
      }
    } catch {
      setError('Unable to load.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      if (!hasDataRef.current) setLoading(true);
      void load();
      const unsub = subscribeCaptureSync(() => undefined);
      void getCaptureSync();
      return () => {
        unsub();
      };
    }, [load]),
  );

  const name =
    user?.firstName ||
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'there';
  const greeting = greetingParts(dashboard?.greeting ?? 'Hello', name);
  const resurfaced = resurfacedMemory(observations);
  let graph: ReturnType<typeof worldGraph> = { nodes: [], edges: [] };
  try {
    graph = worldGraph(
      topics.length > 0 ? topics : dashboard?.topics ?? [],
      projects,
      observations,
      5,
    );
  } catch {
    graph = { nodes: [], edges: [] };
  }
  let noticed: ReturnType<typeof noticedDiscovery> = null;
  let prompts: string[] = [];
  let week: ReturnType<typeof weekDays> = [];
  try {
    noticed = noticedDiscovery({
      dashboard,
      brief,
      predictions: predictions?.items ?? [],
    });
    prompts = askPrompts({
      topics: topics.length > 0 ? topics : dashboard?.topics ?? [],
      projects,
      weekCount: dashboard?.weekCount ?? 0,
    });
    week = weekDays(
      dashboard?.habit?.week ?? [],
      dashboard?.activity ?? [],
      dashboard?.weekCount ?? 0,
    );
  } catch {
    noticed = null;
    prompts = [];
    week = [];
  }
  const stage = homeStage({
    totalCount: dashboard?.totalCount ?? observations.length,
    topicCount: topics.length,
    weekCount: dashboard?.weekCount ?? 0,
    hasPattern: Boolean(noticed),
  });
  const stageCopy = homeStageCopy(stage);

  if (loading && observations.length === 0 && !dashboard && !error) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <KairosState kind="loading" title="Loading your world" />
      </View>
    );
  }

  if (error && observations.length === 0 && !dashboard) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <KairosState kind="error" title="Unable to load" actionLabel="Retry" onAction={() => void load()} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.page,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + FLOATING_TAB_BAR_CONTENT + 24,
          },
        ]}
      >
        <KairosEnter>
          <View style={styles.header}>
            <View style={styles.hello}>
              <KairosText variant="display" accessibilityRole="header">
                {greeting.period}, {greeting.name}.
              </KairosText>
              <KairosText variant="caption" color="textSecondary" style={{ marginTop: 8 }}>
                {stageCopy.body}
              </KairosText>
            </View>
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/profile')}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              hitSlop={12}
            >
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.surface }]}>
                  <KairosText variant="title">{name.slice(0, 1).toUpperCase()}</KairosText>
                </View>
              )}
            </Pressable>
          </View>
        </KairosEnter>

        <KairosEnter delay={40}>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/capture')}
            accessibilityRole="button"
            accessibilityLabel="Capture a memory"
          >
            <View pointerEvents="none">
              <KairosInput
                editable={false}
                placeholder={stage === 'first-day' ? stageCopy.title : 'Capture a thought…'}
              />
            </View>
          </Pressable>
          <View style={styles.sourceRow}>
            {[
              { icon: 'type' as const, label: 'Text', href: '/(app)/(tabs)/capture' },
              { icon: 'mic' as const, label: 'Voice', href: '/(app)/voice-capture' },
              { icon: 'image' as const, label: 'Photo', href: '/(app)/(tabs)/capture' },
              { icon: 'link' as const, label: 'Link', href: '/(app)/(tabs)/capture' },
            ].map((item) => (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.href as never)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={styles.sourceBtn}
              >
                <Feather name={item.icon} size={16} color={colors.textSecondary} />
                <KairosText variant="meta" color="textSecondary">
                  {item.label}
                </KairosText>
              </Pressable>
            ))}
          </View>
        </KairosEnter>

        <KairosEnter delay={80}>
          <KairosSectionHeader label="Your world" action="Topics" onAction={() => router.push('/(app)/topics')} />
          <HomeWorld
            nodes={graph.nodes}
            edges={graph.edges}
            width={width}
            emptyCopy={stageCopy.title}
            onPressNode={(href) => router.push(href as never)}
          />
        </KairosEnter>

        {noticed ? (
          <KairosEnter delay={100}>
            <KairosSectionHeader
              label="Kairos noticed"
              action="Discover"
              onAction={() => router.push('/(app)/discover')}
            />
            <KairosCard
              onPress={() => router.push(noticed.href as never)}
              accessibilityLabel={noticed.title}
            >
              <KairosText variant="title">{noticed.title}</KairosText>
              <KairosText variant="body" color="textSecondary" style={{ marginTop: 8 }}>
                {noticed.body}
              </KairosText>
              {noticed.why ? (
                <KairosText variant="caption" color="textMuted" style={{ marginTop: 8 }}>
                  {noticed.why}
                  {noticed.evidenceCount > 0 ? ` · ${noticed.evidenceCount} memories` : ''}
                </KairosText>
              ) : null}
            </KairosCard>
          </KairosEnter>
        ) : null}

        <KairosEnter delay={120}>
          <KairosSectionHeader label="Ask Kairos" action="Open" onAction={() => router.push('/(app)/(tabs)/ask')} />
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/ask')}
            accessibilityRole="button"
            accessibilityLabel="Ask Kairos"
          >
            <View pointerEvents="none">
              <KairosInput editable={false} placeholder="What do you want to know?" />
            </View>
          </Pressable>
          {prompts.length > 0 ? (
            <View style={styles.promptRow}>
              {prompts.map((prompt) => (
                <KairosPill
                  key={prompt}
                  label={prompt}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/(tabs)/ask',
                      params: { q: prompt },
                    })
                  }
                />
              ))}
            </View>
          ) : null}
        </KairosEnter>

        {resurfaced ? (
          <KairosEnter delay={140}>
            <KairosSectionHeader label="Last remembered" />
            <KairosMemoryCard
              title={memoryTitle(resurfaced.observation.filename, resurfaced.observation.summary)}
              date={resurfaced.label}
              snippet={resurfaced.observation.summary ?? undefined}
              pills={(resurfaced.observation.topics ?? []).map((topic) => topic.name)}
              onPress={() => router.push(`/(app)/observation/${resurfaced.observation.id}`)}
            />
          </KairosEnter>
        ) : null}

        {week.length > 0 ? (
          <KairosEnter delay={160}>
            <KairosSectionHeader label="Your week" />
            <View style={styles.week}>
              {week.map((day) => (
                <View key={day.date} style={styles.weekDay}>
                  <View
                    style={[
                      styles.weekDot,
                      {
                        backgroundColor: day.count > 0 ? colors.accent : colors.surface,
                        opacity: day.count > 0 ? 1 : 0.5,
                      },
                    ]}
                  />
                  <KairosText variant="meta" color="textMuted">
                    {day.label.slice(0, 2)}
                  </KairosText>
                </View>
              ))}
            </View>
          </KairosEnter>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  hello: { flex: 1, paddingRight: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sourceBtn: {
    minHeight: 44,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  promptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  weekDay: { alignItems: 'center', gap: 8, minWidth: 32 },
  weekDot: { width: 10, height: 10, borderRadius: 5 },
});
