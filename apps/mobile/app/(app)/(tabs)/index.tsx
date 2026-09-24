import { useAuth, useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SoftAurora } from '../../../components/SoftAurora';
import { ThemedText } from '../../../components/ThemedText';
import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
} from '../../../components/ui/EmptyState';
import { AccentGradient, GlassPanel, ScreenGradient } from '../../../components/ui/Glass';
import { SoftTile } from '../../../components/ui/SoftScreen';
import { toneForIndex } from '../../../components/ui/MemoryCards';
import {
  fetchObservations,
  fetchTopics,
  isProcessingObservationStatus,
  observationStageLabel,
  type ApiObservation,
  type ApiTopicSummary,
} from '../../../lib/api';
import { getCaptureSync, subscribeCaptureSync, syncBannerText } from '../../../lib/syncStatus';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { auroraToneColors } from '../../../theme';

const SCREEN_W = Dimensions.get('window').width;
const H_PAD = 22;
const GAP = 12;
const COL = (SCREEN_W - H_PAD * 2 - GAP) / 2;

type IconName = React.ComponentProps<typeof Feather>['name'];

function observationIcon(type: ApiObservation['type']): IconName {
  switch (type) {
    case 'IMAGE':
      return 'camera';
    case 'PDF':
    case 'DOCUMENT':
      return 'file-text';
    case 'TEXT':
    default:
      return 'edit-3';
  }
}

function ObservationTile({
  observation,
  onPress,
}: {
  observation: ApiObservation;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const ready = observation.status === 'COMPLETED';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={observation.filename}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
    >
      <GlassPanel style={styles.memoryTile} contentStyle={styles.memoryInner} padded={false}>
        <View style={[styles.memoryIcon, { backgroundColor: colors.accentGlow }]}>
          <Feather name={observationIcon(observation.type)} size={18} color={colors.accent} />
        </View>
        <ThemedText colorKey="text" style={styles.memoryTitle} numberOfLines={2}>
          {observation.filename}
        </ThemedText>
        <ThemedText colorKey="textMuted" style={styles.memoryMeta} numberOfLines={1}>
          {ready
            ? new Date(observation.processedAt || observation.updatedAt).toLocaleDateString()
            : observationStageLabel(observation)}
        </ThemedText>
      </GlassPanel>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius } = useAppTheme();

  const [observations, setObservations] = useState<ApiObservation[]>([]);
  const [topics, setTopics] = useState<ApiTopicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncText, setSyncText] = useState<string | null>(syncBannerText());
  const hasDataRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Sign in to view your home.');
      const [obs, topicData] = await Promise.all([
        fetchObservations(token),
        fetchTopics({ token, limit: 8 }),
      ]);
      setObservations(obs);
      setTopics(topicData.items);
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

  if (loading && observations.length === 0 && !error) {
    return (
      <ScreenGradient>
        <LoadingSkeleton rows={5} />
      </ScreenGradient>
    );
  }
  if (error && observations.length === 0) {
    return (
      <ScreenGradient>
        <ErrorState title="Unable to load" onRetry={() => void load()} />
      </ScreenGradient>
    );
  }

  const processing = observations.filter((o) => isProcessingObservationStatus(o.status));
  const completed = observations.filter((o) => o.status === 'COMPLETED');
  const recent = completed.slice(0, 6);
  const todayKey = new Date().toISOString().slice(0, 10);
  const createdToday = observations.filter((o) => o.createdAt.startsWith(todayKey)).length;

  return (
    <ScreenGradient>
      <FadeInContent>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 108 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <ThemedText colorKey="text" style={styles.greeting} numberOfLines={1}>
              {name}
            </ThemedText>
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/profile')}
              accessibilityLabel="Profile"
              hitSlop={8}
            >
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatarFallback,
                    { backgroundColor: colors.accentGlow, borderColor: colors.glassBorder },
                  ]}
                >
                  <ThemedText colorKey="accent" style={styles.avatarLetter}>
                    {name.slice(0, 1).toUpperCase()}
                  </ThemedText>
                </View>
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push('/(app)/dashboard')}
            accessibilityRole="button"
            accessibilityLabel="Dashboard"
          >
          <GlassPanel style={styles.signalCard} contentStyle={styles.signalInner} padded={false}>
            <SoftAurora compact />
            <View style={styles.signalLeft}>
              <ThemedText colorKey="text" style={styles.signalValue}>
                {createdToday}
              </ThemedText>
              <ThemedText colorKey="textMuted" style={styles.signalHint}>
                today
              </ThemedText>
            </View>
            {processing.length > 0 ? (
              <Pressable
                onPress={() => router.push('/(app)/activity')}
                style={[styles.signalBadge, { backgroundColor: colors.accentGlow }]}
                accessibilityLabel="Processing"
              >
                <Feather name="loader" size={14} color={colors.accent} />
                <ThemedText colorKey="accent" style={styles.signalBadgeText}>
                  {processing.length}
                </ThemedText>
              </Pressable>
            ) : null}
          </GlassPanel>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(app)/(tabs)/ask');
            }}
            accessibilityRole="button"
            accessibilityLabel="Ask"
          >
            <AccentGradient style={[styles.askCard, { borderRadius: radius.xl }]}>
              <Feather name="message-circle" size={20} color={colors.inverseText} />
              <ThemedText colorKey="inverseText" style={styles.askTitle}>
                Ask
              </ThemedText>
              <Feather name="arrow-up-right" size={16} color={colors.inverseText} />
            </AccentGradient>
          </Pressable>

          <View style={styles.row}>
            <SoftTile
              label="Capture"
              icon="plus"
              width={COL}
              onPress={() => router.push('/(app)/quick-capture')}
            />
            <SoftTile
              label="Search"
              icon="search"
              width={COL}
              onPress={() => router.push('/(app)/search')}
            />
          </View>

          <View style={styles.row}>
            <SoftTile
              label="Dashboard"
              icon="bar-chart-2"
              width={COL}
              onPress={() => router.push('/(app)/dashboard')}
            />
            <SoftTile
              label="Predictions"
              icon="zap"
              width={COL}
              onPress={() => router.push('/(app)/predictions')}
            />
          </View>

          {syncText ? (
            <GlassPanel>
              <ThemedText colorKey="textMuted" style={styles.syncText}>
                {syncText}
              </ThemedText>
            </GlassPanel>
          ) : null}

          <View style={styles.navRow}>
            {(
              [
                { icon: 'clock' as const, label: 'Timeline', href: '/(app)/timeline' },
                { icon: 'book-open' as const, label: 'Brief', href: '/(app)/brief' },
                { icon: 'hash' as const, label: 'Topics', href: '/(app)/topics' },
                { icon: 'folder' as const, label: 'Projects', href: '/(app)/projects' },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.href)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={styles.navItem}
              >
                <View style={[styles.navIcon, { backgroundColor: colors.accentGlow }]}>
                  <Feather name={item.icon} size={18} color={colors.accent} />
                </View>
              </Pressable>
            ))}
          </View>

          {recent.length === 0 ? (
            <EmptyState
              title="Nothing yet"
              actionLabel="Capture"
              onAction={() => router.push('/(app)/quick-capture')}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}
              decelerationRate="fast"
            >
              {recent.map((observation) => (
                <ObservationTile
                  key={observation.id}
                  observation={observation}
                  onPress={() => router.push(`/(app)/observation/${observation.id}`)}
                />
              ))}
            </ScrollView>
          )}

          {topics.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}
            >
              {topics.map((topic, index) => {
                const palette = auroraToneColors(colors, toneForIndex(index % 3));
                return (
                  <Pressable
                    key={topic.id}
                    onPress={() => router.push(`/(app)/topics/${topic.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={topic.name}
                  >
                    <GlassPanel
                      padded={false}
                      style={{ borderRadius: radius.full }}
                      contentStyle={styles.topicChip}
                    >
                      <View style={[styles.topicDot, { backgroundColor: palette.accent }]} />
                      <ThemedText colorKey="text" style={styles.topicLabel} numberOfLines={1}>
                        {topic.name}
                      </ThemedText>
                    </GlassPanel>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </ScrollView>
      </FadeInContent>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: H_PAD,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 32,
    letterSpacing: -0.6,
    flex: 1,
    paddingRight: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },

  signalCard: {
    overflow: 'hidden',
    minHeight: 72,
  },
  signalInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  signalLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    zIndex: 1,
  },
  signalValue: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 32,
    letterSpacing: -0.4,
  },
  signalHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  signalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    zIndex: 1,
  },
  signalBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },

  askCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  askTitle: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    letterSpacing: -0.2,
  },

  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  memoryTile: {
    width: 132,
    height: 118,
  },
  memoryInner: {
    height: 118,
    padding: 14,
    gap: 8,
    justifyContent: 'space-between',
  },
  memoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 17,
  },
  memoryMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 40,
  },
  topicDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  topicLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    maxWidth: 110,
  },
  syncText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
