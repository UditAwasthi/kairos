import { useAuth, useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { AccentGradient, GlassPanel, ScreenGradient } from '../../../components/ui/Glass';
import { toneForIndex } from '../../../components/ui/MemoryCards';
import {
  fetchObservations,
  fetchTopics,
  isProcessingObservationStatus,
  observationStageLabel,
  type ApiObservation,
  type ApiTopicSummary,
} from '../../../lib/api';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { auroraToneColors } from '../../../theme';

const SCREEN_W = Dimensions.get('window').width;
const H_PAD = 20;
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

function QuickTile({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [{ width: COL, opacity: pressed ? 0.9 : 1 }]}
    >
      <GlassPanel
        style={styles.quickTile}
        contentStyle={styles.quickInner}
        padded={false}
      >
        <View style={[styles.quickIcon, { backgroundColor: colors.accentGlow }]}>
          <Feather name={icon} size={22} color={colors.accent} />
        </View>
        <ThemedText colorKey="text" style={styles.quickLabel}>
          {label}
        </ThemedText>
      </GlassPanel>
    </Pressable>
  );
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
      <GlassPanel
        style={styles.memoryTile}
        contentStyle={styles.memoryInner}
        padded={false}
      >
        <View style={[styles.memoryIcon, { backgroundColor: colors.accentGlow }]}>
          <Feather
            name={observationIcon(observation.type)}
            size={18}
            color={colors.accent}
          />
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
    } catch {
      setError('Unable to load home.');
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        setLoading(true);
        await load();
        if (!cancelled) setLoading(false);
      })();
      return () => {
        cancelled = true;
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
        <ErrorState title="Unable to load home" message={error} onRetry={() => void load()} />
      </ScreenGradient>
    );
  }

  const processing = observations.filter((o) =>
    isProcessingObservationStatus(o.status),
  );
  const failed = observations.filter((o) => o.status === 'FAILED');
  const completed = observations.filter((o) => o.status === 'COMPLETED');
  const recent = completed.slice(0, 6);
  const todayKey = new Date().toISOString().slice(0, 10);
  const createdToday = observations.filter((o) =>
    o.createdAt.startsWith(todayKey),
  ).length;

  return (
    <ScreenGradient>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 108 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <ThemedText colorKey="textMuted" style={styles.eyebrow}>
              Your memory
            </ThemedText>
            <ThemedText colorKey="text" style={styles.greeting} numberOfLines={1}>
              Hi, {name}
            </ThemedText>
          </View>
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

        <GlassPanel style={styles.signalCard} contentStyle={styles.signalInner} padded={false}>
          <SoftAurora compact />
          <View style={styles.signalLeft}>
            <View style={[styles.signalIcon, { backgroundColor: colors.accentGlow }]}>
              <Feather name="activity" size={18} color={colors.accent} />
            </View>
            <View>
              <ThemedText colorKey="text" style={styles.signalValue}>
                {createdToday} captured today
              </ThemedText>
              <ThemedText colorKey="textMuted" style={styles.signalHint}>
                {processing.length > 0
                  ? `${processing.length} processing`
                  : failed.length > 0
                    ? `${failed.length} need attention`
                    : completed.length > 0
                      ? `${completed.length} ready`
                      : 'Capture something to get started'}
              </ThemedText>
            </View>
          </View>
          {processing.length > 0 || failed.length > 0 ? (
            <Pressable
              onPress={() => router.push('/(app)/activity')}
              style={[styles.signalBadge, { backgroundColor: colors.accentGlow }]}
              accessibilityLabel="Processing activity"
            >
              <Feather name="loader" size={14} color={colors.accent} />
              <ThemedText colorKey="accent" style={styles.signalBadgeText}>
                {processing.length + failed.length}
              </ThemedText>
            </Pressable>
          ) : null}
        </GlassPanel>

        <AccentGradient style={[styles.askCard, { borderRadius: radius.xl }]}>
          <View style={styles.askCopy}>
            <Feather name="message-circle" size={24} color={colors.inverseText} />
            <View style={styles.askText}>
              <ThemedText colorKey="inverseText" style={styles.askTitle}>
                Ask Kairos
              </ThemedText>
              <ThemedText colorKey="inverseText" style={styles.askHint}>
                Answers from your memories
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(app)/(tabs)/ask');
            }}
            accessibilityRole="button"
            accessibilityLabel="Ask now"
            style={({ pressed }) => [
              styles.askCta,
              {
                backgroundColor: colors.inverseText,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <ThemedText colorKey="accent" style={styles.askCtaLabel}>
              Ask now
            </ThemedText>
          </Pressable>
        </AccentGradient>

        <View style={styles.row}>
          <QuickTile
            label="Capture"
            icon="plus"
            onPress={() => router.push('/(app)/(tabs)/capture')}
          />
          <QuickTile
            label="Search"
            icon="search"
            onPress={() => router.push('/(app)/search')}
          />
        </View>

        <View style={styles.sectionHead}>
          <ThemedText colorKey="text" style={styles.sectionTitle}>
            Continue
          </ThemedText>
          <Pressable onPress={() => router.push('/(app)/(tabs)/timeline')} hitSlop={8}>
            <ThemedText colorKey="accent" style={styles.sectionLink}>
              Timeline
            </ThemedText>
          </Pressable>
        </View>

        {recent.length === 0 ? (
          <EmptyState
            title="No ready observations yet"
            message={
              processing.length > 0
                ? 'Processing is in progress. Ready items will appear here.'
                : 'Upload a document to start building your memory.'
            }
            actionLabel="Capture"
            onAction={() => router.push('/(app)/(tabs)/capture')}
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

        <GlassPanel style={styles.navStrip} contentStyle={styles.navInner} padded={false}>
          {(
            [
              { icon: 'clock' as const, label: 'Timeline', href: '/(app)/(tabs)/timeline' },
              { icon: 'layers' as const, label: 'Activity', href: '/(app)/activity' },
              { icon: 'hash' as const, label: 'Topics', href: '/(app)/topics' },
              { icon: 'tag' as const, label: 'Entities', href: '/(app)/entities' },
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
              <ThemedText colorKey="textMuted" style={styles.navLabel}>
                {item.label}
              </ThemedText>
            </Pressable>
          ))}
        </GlassPanel>

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
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: H_PAD,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCopy: { flex: 1, gap: 2, paddingRight: 12 },
  eyebrow: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  greeting: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    letterSpacing: -0.5,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },

  signalCard: {
    overflow: 'hidden',
    minHeight: 72,
  },
  signalInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  signalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  signalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  signalHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 1,
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
    padding: 18,
    gap: 16,
  },
  askCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  askText: { flex: 1, gap: 2 },
  askTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  askHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    opacity: 0.85,
  },
  askCta: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askCtaLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },

  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  quickTile: {
    minHeight: 104,
  },
  quickInner: {
    minHeight: 104,
    padding: 16,
    justifyContent: 'space-between',
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -4,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  hScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  memoryTile: {
    width: 150,
    height: 130,
  },
  memoryInner: {
    height: 130,
    padding: 14,
    gap: 8,
    justifyContent: 'space-between',
  },
  memoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 17,
  },
  memoryMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },

  navStrip: {},
  navInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  navItem: {
    alignItems: 'center',
    gap: 6,
    minWidth: 64,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },

  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  topicDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  topicLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    maxWidth: 110,
  },
});
