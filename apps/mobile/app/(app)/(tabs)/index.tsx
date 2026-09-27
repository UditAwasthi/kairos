import { useAuth, useUser } from '@clerk/expo';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FLOATING_TAB_BAR_CONTENT } from '../../../components/FloatingTabBar';
import {
  BriefTile,
  CaptureFab,
  DashboardTile,
  DiscoverRail,
  RecallCard,
  ResurfacedPanel,
  StatusStrip,
  TalkCard,
} from '../../../components/home/HomeWidgets';
import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { DriftBlob, FadeRise } from '../../../components/ui/OnboardingMotion';
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
import {
  exploreTopics,
  greetingAccent,
  greetingParts,
  greetingWhisper,
  homeBriefCopy,
  homeDashboardCopy,
  homePredictionItem,
  homeProjectPreview,
  homeStatusLine,
  memoryTitle,
  resurfacedMemory,
  weekDays,
} from '../../../lib/homeSummary';
import { homeFont, homeSurface } from '../../../lib/homeTheme';
import { getCaptureSync, subscribeCaptureSync, syncBannerText } from '../../../lib/syncStatus';
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
const GUTTER = 22;

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

function typeScale(width: number) {
  const t = Math.min(1, Math.max(0.84, width / 390));
  return {
    greet: Math.round(34 * t),
  };
}

export default function HomeScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, isLight } = useAppTheme();
  const surface = homeSurface(colors, isLight);
  const scale = typeScale(width);

  const cached = readHomeCache();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(cached?.dashboard ?? null);
  const [observations, setObservations] = useState<ApiObservation[]>(cached?.observations ?? []);
  const [topics, setTopics] = useState<ApiTopicSummary[]>(cached?.topics ?? []);
  const [predictions, setPredictions] = useState<PredictionsSummary | null>(
    cached?.predictions ?? null,
  );
  const [brief, setBrief] = useState<DailyBrief | null>(cached?.brief ?? null);
  const [projects, setProjects] = useState<ApiProjectSummary[]>(cached?.projects ?? []);
  const [fileToken, setFileToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [syncText, setSyncText] = useState<string | null>(syncBannerText());
  const hasDataRef = useRef(Boolean(cached));

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Sign in to view your home.');
      setFileToken(token);
      const [nextObservations, topicData, nextDashboard, nextPredictions, nextBrief, projectData] =
        await Promise.all([
          fetchObservations(token, { limit: 12 }),
          fetchTopics({ token, limit: 12 }).catch(() => ({ items: [] as ApiTopicSummary[] })),
          fetchDashboard(token).catch(() => null),
          fetchPredictions(token).catch(() => null),
          fetchDailyBrief(token).catch(() => null),
          fetchProjects({ token, limit: 6 }).catch(() => ({ items: [] as ApiProjectSummary[] })),
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
      hasDataRef.current = true;
    } catch {
      setError('Unable to load.');
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        if (!hasDataRef.current) setLoading(true);
        await load();
        if (!cancelled) setLoading(false);
      })();
      const unsub = subscribeCaptureSync(() => setSyncText(syncBannerText()));
      setSyncText(syncBannerText());
      void getCaptureSync();
      return () => {
        cancelled = true;
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
  const accent = greetingAccent(greeting.period);
  const resurfaced = resurfacedMemory(observations);
  const whisper = greetingWhisper(resurfaced?.kind ?? null);
  const chips = exploreTopics(topics.length > 0 ? topics : dashboard?.topics ?? [], 5).shown;
  const dashboardCopy = homeDashboardCopy(dashboard);
  const briefCopy = homeBriefCopy(brief);
  const prediction = homePredictionItem(predictions?.items ?? []);
  const projectPreview = homeProjectPreview(projects, projects.length);
  const days = dashboard
    ? weekDays(dashboard.habit.week, dashboard.activity, dashboard.weekCount)
    : [];
  const status = homeStatusLine({
    streak: dashboard?.streak.current ?? 0,
    processingCount: dashboard?.processingCount ?? 0,
    syncText,
  });

  if (loading && observations.length === 0 && !dashboard && !error) {
    return (
      <View style={[styles.root, { backgroundColor: surface.canvas }]}>
        <LoadingSkeleton rows={4} />
      </View>
    );
  }

  if (error && observations.length === 0 && !dashboard) {
    return (
      <View style={[styles.root, { backgroundColor: surface.canvas }]}>
        <ErrorState title="Unable to load" onRetry={() => void load()} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: surface.canvas }]}>
      <DriftBlob color={surface.blob} style={styles.blob} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.page,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + FLOATING_TAB_BAR_CONTENT + 80,
          },
        ]}
      >
        <FadeRise delay={0}>
          <View style={styles.headerRow}>
            <View />
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/profile')}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              hitSlop={12}
            >
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: surface.pill }]}>
                  <Text style={[styles.avatarLetter, { color: surface.ink }]}>
                    {name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </FadeRise>

        <FadeRise delay={20}>
          <View style={styles.greetBlock}>
            <Text
              style={[
                styles.greeting,
                {
                  color: surface.text,
                  fontSize: scale.greet,
                  lineHeight: scale.greet + 8,
                },
              ]}
            >
              {accent.lead ? `${accent.lead} ` : null}
              <Text style={{ color: surface.ink }}>{accent.accent}</Text>
              {', '}
              {greeting.name}.
            </Text>
            {whisper ? (
              <Text style={[styles.whisper, { color: surface.muted }]}>{whisper}</Text>
            ) : null}
          </View>
        </FadeRise>

        <FadeRise delay={40}>
          <View style={styles.hero}>
            <TalkCard surface={surface} onPress={() => router.push('/(app)/(tabs)/ask')} />
            <RecallCard surface={surface} onPress={() => router.push('/(app)/(tabs)/recall')} />
          </View>
        </FadeRise>

        <FadeRise delay={120}>
          <ResurfacedPanel
            observation={resurfaced?.observation ?? null}
            label={resurfaced?.label ?? 'Resurfaced for you'}
            surface={surface}
            fileToken={fileToken}
            onAsk={() => {
              if (!resurfaced) return;
              router.push({
                pathname: '/(app)/(tabs)/ask',
                params: {
                  scopeType: 'observation',
                  scopeId: resurfaced.observation.id,
                  scopeName: memoryTitle(
                    resurfaced.observation.filename,
                    resurfaced.observation.summary,
                  ).slice(0, 48),
                },
              });
            }}
            onOpenLink={(href) => router.push(href as never)}
            onEmpty={() => router.push('/(app)/quick-capture')}
          />
        </FadeRise>

        <FadeRise delay={200}>
          <View style={styles.secondary}>
            <DashboardTile
              surface={surface}
              body={dashboardCopy.body}
              hint={dashboardCopy.hint}
              days={days}
              onPress={() => router.push('/(app)/dashboard')}
            />
            <BriefTile
              surface={surface}
              body={briefCopy.body}
              hint={briefCopy.hint}
              onPress={() => router.push('/(app)/brief')}
            />
          </View>
        </FadeRise>

        <FadeRise delay={280}>
          <DiscoverRail
            prediction={prediction}
            projects={projectPreview}
            topics={chips}
            surface={surface}
            onPrediction={() => router.push('/(app)/predictions')}
            onProjects={() => router.push('/(app)/projects')}
            onTopic={(id) => router.push(`/(app)/topics/${id}`)}
          />
        </FadeRise>

        {status ? (
          <FadeRise delay={320}>
            <StatusStrip
              text={status}
              color={surface.muted}
              streak={dashboard?.streak.current}
            />
          </FadeRise>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.fabWrap,
          { bottom: insets.bottom + FLOATING_TAB_BAR_CONTENT + 10, right: GUTTER },
        ]}
      >
        <CaptureFab surface={surface} onPress={() => router.push('/(app)/quick-capture')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  blob: {
    width: 260,
    height: 260,
    top: -70,
    right: -90,
  },
  page: {
    paddingHorizontal: GUTTER,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: homeFont.sansMedium,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  greetBlock: { gap: 6 },
  greeting: {
    fontFamily: homeFont.serif,
    letterSpacing: -0.5,
    paddingRight: 36,
  },
  whisper: {
    fontFamily: homeFont.sans,
    fontSize: 13,
    letterSpacing: 0.15,
  },
  hero: { gap: 10 },
  secondary: {
    flexDirection: 'row',
    gap: 10,
  },
  fabWrap: {
    position: 'absolute',
  },
});
