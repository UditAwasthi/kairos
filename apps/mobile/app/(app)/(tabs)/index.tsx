import { useAuth, useUser } from '@clerk/expo';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FLOATING_TAB_BAR_CONTENT } from '../../../components/FloatingTabBar';
import {
  AssistChip,
  HomeFab,
  HomeSearchBar,
  MemoryTile,
  SectionHeader,
  ShortcutRow,
  SyncBanner,
  TodayCard,
  TopicChip,
} from '../../../components/home/MaterialHome';
import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
} from '../../../components/ui/EmptyState';
import {
  fetchObservations,
  fetchTopics,
  isProcessingObservationStatus,
  observationFileUri,
  type ApiObservation,
  type ApiTopicSummary,
} from '../../../lib/api';
import { getCaptureSync, subscribeCaptureSync, syncBannerText } from '../../../lib/syncStatus';
import { readQueryCache, writeQueryCache } from '../../../hooks/useAsync';
import { useAppTheme } from '../../../providers/ThemeProvider';

type HomeCache = {
  observations: ApiObservation[];
  topics: ApiTopicSummary[];
};
const HOME_CACHE = 'home-feed';

const SCREEN_W = Dimensions.get('window').width;
const H_PAD = 16;
const GAP = 12;
const TILE_W = (SCREEN_W - H_PAD * 2 - GAP) / 2;

export default function HomeScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const cachedHome = readQueryCache<HomeCache>(HOME_CACHE);
  const [observations, setObservations] = useState<ApiObservation[]>(
    cachedHome?.observations ?? [],
  );
  const [topics, setTopics] = useState<ApiTopicSummary[]>(cachedHome?.topics ?? []);
  const [loading, setLoading] = useState(!cachedHome);
  const [error, setError] = useState<string | null>(null);
  const [syncText, setSyncText] = useState<string | null>(syncBannerText());
  const [fileToken, setFileToken] = useState<string | null>(null);
  const hasDataRef = useRef(Boolean(cachedHome));

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Sign in to view your home.');
      setFileToken(token);
      const [obs, topicData] = await Promise.all([
        fetchObservations(token),
        fetchTopics({ token, limit: 8 }),
      ]);
      setObservations(obs);
      setTopics(topicData.items);
      hasDataRef.current = true;
      writeQueryCache(HOME_CACHE, { observations: obs, topics: topicData.items });
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

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading && observations.length === 0 && !error) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <LoadingSkeleton rows={5} />
      </View>
    );
  }
  if (error && observations.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState title="Unable to load" onRetry={() => void load()} />
      </View>
    );
  }

  const processing = observations.filter((o) => isProcessingObservationStatus(o.status));
  const completed = observations.filter((o) => o.status === 'COMPLETED');
  const recent = completed.slice(0, 6);
  const todayKey = new Date().toISOString().slice(0, 10);
  const createdToday = observations.filter((o) => o.createdAt.startsWith(todayKey)).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FadeInContent>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + FLOATING_TAB_BAR_CONTENT + 88,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={[styles.brand, { color: colors.primary }]}>Kairos</Text>
              <Text style={[styles.greeting, { color: colors.textSecondary }]} numberOfLines={1}>
                {hello}, {name}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/profile')}
              accessibilityLabel="Profile"
              hitSlop={8}
            >
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.avatarLetter, { color: colors.onPrimaryContainer }]}>
                    {name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          <HomeSearchBar onPress={() => router.push('/(app)/search')} />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            <AssistChip
              icon="chat-bubble-outline"
              label="Ask"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(app)/(tabs)/ask');
              }}
            />
            <AssistChip
              icon="add"
              label="Capture"
              onPress={() => router.push('/(app)/quick-capture')}
            />
            <AssistChip icon="topic" label="Topics" onPress={() => router.push('/(app)/topics')} />
            <AssistChip
              icon="timeline"
              label="Timeline"
              onPress={() => router.push('/(app)/timeline')}
            />
            <AssistChip
              icon="insights"
              label="Dashboard"
              onPress={() => router.push('/(app)/dashboard')}
            />
          </ScrollView>

          <TodayCard
            count={createdToday}
            caption={
              processing.length > 0
                ? `${processing.length} still processing`
                : createdToday === 1
                  ? 'memory captured'
                  : 'memories captured'
            }
            onPress={() =>
              processing.length > 0
                ? router.push('/(app)/activity')
                : router.push('/(app)/dashboard')
            }
          />

          {syncText ? <SyncBanner text={syncText} /> : null}

          <SectionHeader
            title="Recent"
            action={recent.length > 0 ? 'See all' : undefined}
            onAction={() => router.push('/(app)/timeline')}
          />
          {recent.length === 0 ? (
            <EmptyState
              title="No memories yet"
              actionLabel="Capture something"
              onAction={() => router.push('/(app)/quick-capture')}
            />
          ) : (
            <View style={styles.memoryGrid}>
              {recent.map((observation, index) => (
                <MemoryTile
                  key={observation.id}
                  observation={observation}
                  index={index}
                  width={TILE_W}
                  photo={
                    observation.type === 'IMAGE' && fileToken
                      ? {
                          uri: observationFileUri(observation.id),
                          headers: { Authorization: `Bearer ${fileToken}` },
                        }
                      : undefined
                  }
                  onPress={() => router.push(`/(app)/observation/${observation.id}`)}
                />
              ))}
            </View>
          )}

          {topics.length > 0 ? (
            <>
              <SectionHeader
                title="Topics"
                action="See all"
                onAction={() => router.push('/(app)/topics')}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topics}
              >
                {topics.map((topic) => (
                  <TopicChip
                    key={topic.id}
                    label={topic.name}
                    onPress={() => router.push(`/(app)/topics/${topic.id}`)}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}

          <SectionHeader title="More" />
          <View style={[styles.listCard, { backgroundColor: colors.surfaceElevated }]}>
            <ShortcutRow
              icon="insights"
              label="Dashboard"
              meta="The day so far"
              onPress={() => router.push('/(app)/dashboard')}
            />
            <ShortcutRow
              icon="auto-awesome"
              label="Predictions"
              meta="What may return"
              onPress={() => router.push('/(app)/predictions')}
            />
            <ShortcutRow
              icon="menu-book"
              label="Brief"
              meta="A quiet reading"
              onPress={() => router.push('/(app)/brief')}
            />
            <ShortcutRow
              icon="folder"
              label="Projects"
              meta="Hold a place"
              onPress={() => router.push('/(app)/projects')}
            />
            <ShortcutRow
              icon="history"
              label="Activity"
              meta="What's in progress"
              onPress={() => router.push('/(app)/activity')}
            />
          </View>
        </ScrollView>
      </FadeInContent>

      <HomeFab
        bottom={insets.bottom + FLOATING_TAB_BAR_CONTENT + 16}
        onPress={() => router.push('/(app)/quick-capture')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: H_PAD,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  brand: {
    fontFamily: 'Inter_500Medium',
    fontSize: 22,
    letterSpacing: 0,
  },
  greeting: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginTop: 2,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  chips: {
    gap: 8,
    paddingVertical: 2,
  },
  memoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  topics: {
    gap: 8,
  },
  listCard: {
    borderRadius: 12,
    overflow: 'hidden',
    paddingVertical: 4,
  },
});
