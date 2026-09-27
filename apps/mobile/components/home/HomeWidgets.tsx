import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  observationFileUri,
  type ApiObservation,
  type ApiProjectSummary,
  type PredictionItem,
} from '../../lib/api';
import {
  connectionCount,
  memoryTitle,
  observationLinks,
  rememberedStamp,
} from '../../lib/homeSummary';
import { homeFont, type HomeSurface } from '../../lib/homeTheme';
import { ONBOARDING_STEPS } from '../../onboarding';
import {
  BarsMark,
  BookScene,
  HorizonMark,
  PlantMark,
  PlusMark,
  StackMark,
  TalkScene,
  TalkWave,
  WindowMark,
} from './HomeMarks';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function useHomePress(scale: number) {
  const press = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, scale]) }],
  }));
  return {
    style,
    onPressIn: () => {
      press.value = withSpring(1, { damping: 16, stiffness: 280 });
    },
    onPressOut: () => {
      press.value = withSpring(0, { damping: 16, stiffness: 280 });
    },
  };
}

function hapticPress(onPress: () => void) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  onPress();
}

export function TalkCard({
  surface,
  onPress,
}: {
  surface: HomeSurface;
  onPress: () => void;
}) {
  const press = useHomePress(surface.pressScale);
  return (
    <AnimatedPressable
      onPress={() => hapticPress(onPress)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel="Talk to Kairos"
      style={[styles.heroTalk, surface.shadow, press.style]}
    >
      <LinearGradient colors={[...surface.ask]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroTalkFill}>
        <View style={styles.heroArt}>
          <TalkScene color={surface.ink} size={96} />
          <TalkWave color={surface.ink} />
        </View>
        <Text style={[styles.heroLabel, { color: surface.text }]}>Talk to Kairos</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

export function RecallCard({
  surface,
  onPress,
}: {
  surface: HomeSurface;
  onPress: () => void;
}) {
  const press = useHomePress(surface.pressScale);
  return (
    <AnimatedPressable
      onPress={() => hapticPress(onPress)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel="Recall a memory"
      style={[styles.heroRecall, surface.shadow, { backgroundColor: surface.recall }, press.style]}
    >
      <BookScene color={surface.ink} size={58} />
      <Text style={[styles.heroRecallLabel, { color: surface.text }]}>Recall a memory</Text>
    </AnimatedPressable>
  );
}

function useCountUp(total: number, play: boolean, token: string) {
  const [shown, setShown] = useState(0);
  const playId = useRef(0);

  useEffect(() => {
    if (!play || total <= 0) {
      setShown(0);
      return;
    }
    const current = ++playId.current;
    let next = 0;
    setShown(0);
    const timer = setInterval(() => {
      if (current !== playId.current) return;
      next += 1;
      setShown(next);
      if (next >= total) clearInterval(timer);
    }, 70);
    return () => clearInterval(timer);
  }, [play, total, token]);

  return shown;
}

export function ResurfacedPanel({
  observation,
  label,
  surface,
  fileToken,
  onAsk,
  onOpenLink,
  onEmpty,
}: {
  observation: ApiObservation | null;
  label: string;
  surface: HomeSurface;
  fileToken?: string | null;
  onAsk: () => void;
  onOpenLink: (href: string) => void;
  onEmpty: () => void;
}) {
  const press = useHomePress(surface.pressScale);
  const [open, setOpen] = useState(false);
  const extra = useSharedValue(0);
  const progress = useSharedValue(0);
  const title = observation
    ? memoryTitle(observation.filename, observation.summary)
    : ONBOARDING_STEPS[2].hint;
  const links = observationLinks(observation);
  const connections = connectionCount(observation);
  const counted = useCountUp(connections, open, observation?.id ?? 'empty');
  const hasImage = observation?.type === 'IMAGE' && Boolean(fileToken);
  const snippet = observation?.extractedText?.trim() || observation?.summary?.trim() || null;

  const setExpanded = (next: boolean) => {
    setOpen(next);
    progress.value = withSpring(next ? 1 : 0, { damping: 18, stiffness: 200 });
  };

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!observation) {
      onEmpty();
      return;
    }
    setExpanded(!open);
  };

  const swipe = Gesture.Pan()
    .activeOffsetY([-18, 18])
    .onEnd((event) => {
      if (event.translationY > 28) runOnJS(setExpanded)(true);
      else if (event.translationY < -28) runOnJS(setExpanded)(false);
    });

  const reveal = useAnimatedStyle(() => ({
    height: extra.value * progress.value,
    opacity: progress.value,
    overflow: 'hidden' as const,
  }));

  return (
    <GestureDetector gesture={swipe}>
      <AnimatedPressable
        onPress={toggle}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={observation ? title : 'Remember a first thought'}
        accessibilityState={{ expanded: open }}
        style={[styles.panel, surface.shadow, { backgroundColor: surface.panel }, press.style]}
      >
        <View style={styles.panelTop}>
          {hasImage && observation && fileToken ? (
            <Image
              source={{
                uri: observationFileUri(observation.id),
                headers: { Authorization: `Bearer ${fileToken}` },
              }}
              style={styles.thumb}
            />
          ) : (
            <PlantMark color={surface.ink} size={40} />
          )}
          <View style={styles.panelCopy}>
            <Text style={[styles.panelKicker, { color: surface.ink }]}>{label}</Text>
            <Text
              style={[styles.panelBody, { color: surface.text }]}
              numberOfLines={open ? 6 : 2}
            >
              {title}
            </Text>
            <Text style={[styles.panelHint, { color: surface.muted }]}>
              {observation
                ? open
                  ? 'Swipe up to fold'
                  : 'Tap or swipe to expand'
                : ONBOARDING_STEPS[4].hint}
            </Text>
          </View>
        </View>

        <Animated.View style={reveal}>
          <View
            onLayout={(event) => {
              extra.value = event.nativeEvent.layout.height;
            }}
            style={styles.panelExtra}
          >
            {observation ? (
              <>
                {snippet && snippet !== title ? (
                  <Text style={[styles.snippet, { color: surface.muted }]} numberOfLines={4}>
                    {snippet}
                  </Text>
                ) : null}
                <Text style={[styles.panelHint, { color: surface.muted }]}>
                  {rememberedStamp(observation.capturedAt)}
                  {connections > 0 ? ` · ${counted} connection${counted === 1 ? '' : 's'}` : ''}
                </Text>
                {links.length > 0 ? (
                  <View style={styles.linkRow}>
                    {links.map((link) => (
                      <Pressable
                        key={link.id}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onOpenLink(link.href);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={link.name}
                        style={[styles.miniChip, { backgroundColor: surface.pill }]}
                      >
                        <Text style={[styles.chipLabel, { color: surface.text }]} numberOfLines={1}>
                          {link.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onAsk();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Ask Kairos about this"
                  style={[styles.askChip, { backgroundColor: surface.chipFills[0] }]}
                >
                  <Text style={[styles.askChipLabel, { color: surface.ink }]}>Ask Kairos about this</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </Animated.View>
      </AnimatedPressable>
    </GestureDetector>
  );
}

export function QuietTile({
  surface,
  fill,
  kicker,
  body,
  hint,
  mark,
  onPress,
  children,
}: {
  surface: HomeSurface;
  fill: string;
  kicker: string;
  body: string;
  hint?: string | null;
  mark: ReactNode;
  onPress: () => void;
  children?: ReactNode;
}) {
  const press = useHomePress(surface.pressScale);
  return (
    <AnimatedPressable
      onPress={() => hapticPress(onPress)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${kicker}. ${body}`}
      style={[styles.tile, surface.shadow, { backgroundColor: fill }, press.style]}
    >
      {mark}
      <Text style={[styles.panelKicker, { color: surface.ink }]}>{kicker}</Text>
      <Text style={[styles.tileBody, { color: surface.text }]} numberOfLines={2}>
        {body}
      </Text>
      {hint ? (
        <Text style={[styles.panelHint, { color: surface.muted }]} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
      {children}
    </AnimatedPressable>
  );
}

export function DashboardTile({
  surface,
  body,
  hint,
  days,
  onPress,
}: {
  surface: HomeSurface;
  body: string;
  hint?: string | null;
  days: Array<{ date: string; label: string; count: number }>;
  onPress: () => void;
}) {
  return (
    <QuietTile
      surface={surface}
      fill={surface.recall}
      kicker="Dashboard"
      body={body}
      hint={hint}
      mark={<BarsMark color={surface.ink} />}
      onPress={onPress}
    >
      {days.length > 0 ? (
        <View style={styles.week}>
          {days.map((day) => (
            <View
              key={`${day.date}-${day.label}`}
              style={[
                styles.weekDot,
                {
                  backgroundColor: surface.ink,
                  opacity: day.count > 0 ? 0.7 : 0.18,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </QuietTile>
  );
}

export function BriefTile({
  surface,
  body,
  hint,
  onPress,
}: {
  surface: HomeSurface;
  body: string;
  hint?: string | null;
  onPress: () => void;
}) {
  return (
    <QuietTile
      surface={surface}
      fill={surface.chipFills[4]}
      kicker="Daily brief"
      body={body}
      hint={hint}
      mark={<WindowMark color={surface.ink} />}
      onPress={onPress}
    />
  );
}

export function DiscoverRail({
  prediction,
  projects,
  topics,
  surface,
  onPrediction,
  onProjects,
  onTopic,
}: {
  prediction: PredictionItem | null;
  projects: ApiProjectSummary[];
  topics: Array<{ id: string; name: string }>;
  surface: HomeSurface;
  onPrediction: () => void;
  onProjects: () => void;
  onTopic: (id: string) => void;
}) {
  const items: Array<{
    key: string;
    kicker: string;
    body: string;
    fill: string;
    mark: ReactNode;
    onPress: () => void;
  }> = [];

  items.push({
    key: 'predictions',
    kicker: 'Predictions',
    body: prediction?.title ?? 'No patterns yet',
    fill: surface.chipFills[0],
    mark: <HorizonMark color={surface.ink} size={22} />,
    onPress: onPrediction,
  });
  items.push({
    key: 'projects',
    kicker: 'Projects',
    body: projects[0]?.name ?? 'None yet',
    fill: surface.panel,
    mark: <StackMark color={surface.ink} size={22} />,
    onPress: onProjects,
  });
  topics.forEach((topic, index) => {
    items.push({
      key: `topic-${topic.id}`,
      kicker: 'Topic',
      body: topic.name,
      fill: surface.chipFills[(index + 2) % surface.chipFills.length] ?? surface.pill,
      mark: <View style={[styles.chipDot, { backgroundColor: surface.ink }]} />,
      onPress: () => onTopic(topic.id),
    });
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {items.map((item) => (
        <CompactCard key={item.key} surface={surface} item={item} />
      ))}
    </ScrollView>
  );
}

function CompactCard({
  surface,
  item,
}: {
  surface: HomeSurface;
  item: {
    kicker: string;
    body: string;
    fill: string;
    mark: ReactNode;
    onPress: () => void;
  };
}) {
  const press = useHomePress(surface.pressScale);
  return (
    <AnimatedPressable
      onPress={() => hapticPress(item.onPress)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${item.kicker}. ${item.body}`}
      style={[styles.compact, surface.shadow, { backgroundColor: item.fill }, press.style]}
    >
      {item.mark}
      <Text style={[styles.panelKicker, { color: surface.ink }]}>{item.kicker}</Text>
      <Text style={[styles.compactBody, { color: surface.text }]} numberOfLines={2}>
        {item.body}
      </Text>
    </AnimatedPressable>
  );
}

export function StatusStrip({
  text,
  color,
  streak,
}: {
  text: string;
  color: string;
  streak?: number;
}) {
  const shown = useCountUp(streak && streak > 0 ? streak : 0, Boolean(streak && streak > 0), String(streak ?? 0));
  const line =
    streak && streak > 0 && text.includes('recall streak')
      ? `${shown}-day recall streak`
      : text;
  return <Text style={[styles.status, { color }]}>{line}</Text>;
}

export function CaptureFab({
  surface,
  onPress,
}: {
  surface: HomeSurface;
  onPress: () => void;
}) {
  const press = useHomePress(surface.pressScale);
  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel="Remember"
      style={[styles.fab, surface.shadow, { backgroundColor: surface.fab }, press.style]}
    >
      <PlusMark color={surface.ink} size={24} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  heroTalk: {
    minHeight: 188,
    borderRadius: 28,
    overflow: 'hidden',
  },
  heroTalkFill: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  heroArt: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontFamily: homeFont.serif,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  heroRecall: {
    minHeight: 112,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroRecallLabel: {
    fontFamily: homeFont.serif,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    flex: 1,
  },
  tile: {
    flex: 1,
    minHeight: 112,
    padding: 14,
    borderRadius: 22,
    gap: 6,
  },
  tileBody: {
    fontFamily: homeFont.serif,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.15,
  },
  week: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 2,
  },
  weekDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  panel: {
    padding: 18,
    borderRadius: 24,
    gap: 4,
  },
  panelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  panelCopy: {
    flex: 1,
    gap: 4,
  },
  panelKicker: {
    fontFamily: homeFont.sansMedium,
    fontSize: 12,
    letterSpacing: 0.15,
  },
  panelBody: {
    fontFamily: homeFont.serif,
    fontSize: 18,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  panelHint: {
    fontFamily: homeFont.sans,
    fontSize: 12,
    letterSpacing: 0.1,
    marginTop: 2,
  },
  panelExtra: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingTop: 12,
    gap: 10,
  },
  snippet: {
    fontFamily: homeFont.sans,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: 160,
  },
  askChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  askChipLabel: {
    fontFamily: homeFont.sansMedium,
    fontSize: 13,
    letterSpacing: 0.1,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  rail: {
    gap: 10,
    paddingRight: 8,
  },
  compact: {
    width: 148,
    minHeight: 92,
    padding: 12,
    borderRadius: 20,
    gap: 6,
  },
  compactBody: {
    fontFamily: homeFont.serif,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.55,
  },
  chipLabel: {
    fontFamily: homeFont.sans,
    fontSize: 13,
    letterSpacing: 0.1,
  },
  status: {
    fontFamily: homeFont.sans,
    fontSize: 12,
    letterSpacing: 0.15,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
