import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import { observationFileUri, type ApiObservation } from '../../lib/api';
import {
  memoryTitle,
  rememberedStamp,
  rememberedTags,
  type HomeNudge,
  type WorldGraphNode,
} from '../../lib/homeSummary';
import { homeFont, homeShape, type HomeSurface } from '../../lib/homeTheme';
import { azure, cyan } from '../../theme';
import { BookScene, CaptureScene, LeafScene, TalkScene } from './HomeMarks';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function useHomePress(scale: number) {
  const press = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(press.value, [0, 1], [1, scale]) },
      { translateY: interpolate(press.value, [0, 1], [0, 1]) },
    ],
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

export function HighlightAction({
  label,
  mark,
  surface,
  onPress,
}: {
  label: string;
  mark: 'ask' | 'recall';
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
      accessibilityLabel={label}
      style={[styles.highlight, press.style]}
    >
      <LinearGradient colors={[cyan, azure] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.highlightFill}>
        {mark === 'ask' ? (
          <TalkScene color="#101010" size={92} />
        ) : (
          <BookScene color="#101010" size={72} />
        )}
        <Text style={styles.highlightLabel}>{label}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

export function PictureAction({
  label,
  mark,
  photo,
  surface,
  onPress,
}: {
  label: string;
  mark: 'capture' | 'memory';
  photo?: { uri: string; headers?: Record<string, string> } | null;
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
      accessibilityLabel={label}
      style={[
        styles.picture,
        { backgroundColor: surface.panel, borderColor: surface.border },
        press.style,
      ]}
    >
      {photo ? (
        <View style={styles.ovalFrame}>
          <Image source={photo} style={styles.ovalImage} resizeMode="cover" />
        </View>
      ) : (
        <View style={styles.pictureMark}>
          {mark === 'capture' ? (
            <CaptureScene color={surface.text} size={64} />
          ) : (
            <LeafScene color={surface.text} size={48} />
          )}
        </View>
      )}
      <Text style={[styles.pictureLabel, { color: surface.text }]}>{label}</Text>
    </AnimatedPressable>
  );
}

export function Pill({
  label,
  surface,
  active = false,
  onPress,
}: {
  label: string;
  surface: HomeSurface;
  active?: boolean;
  onPress?: () => void;
}) {
  const press = useHomePress(surface.pressScale);
  return (
    <AnimatedPressable
      onPress={onPress ? () => hapticPress(onPress) : undefined}
      onPressIn={onPress ? press.onPressIn : undefined}
      onPressOut={onPress ? press.onPressOut : undefined}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[
        styles.pill,
        {
          backgroundColor: active ? surface.text : surface.well,
          borderColor: surface.border,
        },
        onPress ? press.style : null,
      ]}
    >
      <Text style={[styles.pillLabel, { color: active ? surface.inverse : surface.text }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function WorldHero({
  nodes,
  edges,
  width,
  surface,
  onPress,
}: {
  nodes: WorldGraphNode[];
  edges: Array<{ from: string; to: string }>;
  width: number;
  surface: HomeSurface;
  onPress: () => void;
}) {
  const press = useHomePress(surface.pressScale);
  const fieldW = Math.max(280, width - 44);
  const fieldH = 188;
  const byId = new Map(nodes.map((node) => [node.id, node]));

  return (
    <AnimatedPressable
      onPress={() => hapticPress(onPress)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel="World"
      style={[styles.hero, { backgroundColor: surface.panel, borderColor: surface.border }, press.style]}
    >
      <Text style={[styles.heroKicker, { color: surface.faint }]}>World</Text>
      <Svg width={fieldW} height={fieldH} style={styles.field}>
        {STARS.map((star) => (
          <Circle key={`${star.x}-${star.y}`} cx={star.x * fieldW} cy={star.y * fieldH} r={1} fill={surface.faint} />
        ))}
        {edges.map((edge) => {
          const from = byId.get(edge.from);
          const to = byId.get(edge.to);
          if (!from || !to) return null;
          return (
            <Line
              key={`${edge.from}-${edge.to}`}
              x1={from.x * fieldW}
              y1={from.y * fieldH}
              x2={to.x * fieldW}
              y2={to.y * fieldH}
              stroke={cyan}
              strokeOpacity={0.35}
              strokeWidth={1.25}
            />
          );
        })}
        <Circle cx={fieldW * 0.5} cy={fieldH * 0.5} r={16} fill={surface.glow} />
        <Circle cx={fieldW * 0.5} cy={fieldH * 0.5} r={5} fill={azure} />
        {nodes.map((node) => (
          <Circle
            key={`dot-${node.id}`}
            cx={node.x * fieldW}
            cy={node.y * fieldH}
            r={node.x === 0.5 && node.y === 0.5 ? 0.01 : 4}
            fill={surface.text}
          />
        ))}
      </Svg>

      {nodes.map((node) => (
        <Text
          key={node.id}
          numberOfLines={1}
          style={[
            styles.nodeLabel,
            {
              color: surface.text,
              left: node.x * fieldW - 52,
              top: node.y * fieldH - 20,
            },
          ]}
        >
          {node.name}
        </Text>
      ))}
    </AnimatedPressable>
  );
}

const STARS = [
  { x: 0.08, y: 0.14 },
  { x: 0.18, y: 0.42 },
  { x: 0.3, y: 0.12 },
  { x: 0.42, y: 0.2 },
  { x: 0.62, y: 0.16 },
  { x: 0.88, y: 0.22 },
  { x: 0.12, y: 0.62 },
  { x: 0.34, y: 0.8 },
  { x: 0.58, y: 0.84 },
  { x: 0.9, y: 0.58 },
  { x: 0.7, y: 0.46 },
];

export function MetricStrip({
  items,
  surface,
}: {
  items: Array<{ label: string; value: string }>;
  surface: HomeSurface;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.metrics}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[styles.metric, { backgroundColor: surface.panel, borderColor: surface.border }]}
        >
          <Text style={[styles.metricValue, { color: surface.text }]}>{item.value}</Text>
          <Text style={[styles.metricLabel, { color: surface.faint }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function CommandBar({
  icon,
  label,
  trailing,
  surface,
  live = false,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  trailing: React.ComponentProps<typeof Feather>['name'];
  surface: HomeSurface;
  live?: boolean;
  onPress: () => void;
}) {
  const press = useHomePress(surface.pressScale);
  return (
    <AnimatedPressable
      onPress={() => hapticPress(onPress)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.command,
        { backgroundColor: surface.panel, borderColor: surface.border },
        press.style,
      ]}
    >
      <Feather name={icon} size={16} color={surface.text} />
      <Text style={[styles.commandLabel, { color: surface.muted }]}>{label}</Text>
      <View style={[styles.commandTrail, live ? { backgroundColor: surface.glow } : null]}>
        <Feather name={trailing} size={16} color={live ? surface.cyan : surface.text} />
      </View>
    </AnimatedPressable>
  );
}

export function AskConsole({
  prompt,
  chips,
  surface,
  onAsk,
  onChip,
}: {
  prompt: string;
  chips: string[];
  surface: HomeSurface;
  onAsk: () => void;
  onChip: (text: string) => void;
}) {
  const press = useHomePress(surface.pressScale);
  return (
    <View style={[styles.console, { backgroundColor: surface.panel, borderColor: surface.border }]}>
      <Text style={[styles.kicker, { color: surface.faint }]}>Ask Kairos</Text>
      <AnimatedPressable
        onPress={() => hapticPress(onAsk)}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={prompt}
        style={[styles.consolePrompt, press.style]}
      >
        <Text style={[styles.consoleText, { color: surface.text }]}>{prompt}</Text>
        <Feather name="arrow-right" size={18} color={surface.text} />
      </AnimatedPressable>
      {chips.length > 0 ? (
        <View style={styles.chipRow}>
          {chips.map((chip) => (
            <Pill key={chip} label={chip} surface={surface} onPress={() => onChip(chip)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function MemoryCard({
  observation,
  label,
  surface,
  fileToken,
  onPress,
}: {
  observation: ApiObservation | null;
  label: string;
  surface: HomeSurface;
  fileToken?: string | null;
  onPress: () => void;
}) {
  const press = useHomePress(surface.pressScale);
  const title = observation
    ? memoryTitle(observation.filename, observation.summary)
    : 'Remember a first thought';
  const tags = rememberedTags(observation);
  const hasImage = observation?.type === 'IMAGE' && Boolean(fileToken);

  return (
    <AnimatedPressable
      onPress={() => hapticPress(onPress)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[styles.card, { backgroundColor: surface.panel, borderColor: surface.border }, press.style]}
    >
      <Text style={[styles.kicker, { color: surface.faint }]}>{label}</Text>
      {hasImage && observation && fileToken ? (
        <Image
          source={{
            uri: observationFileUri(observation.id),
            headers: { Authorization: `Bearer ${fileToken}` },
          }}
          style={styles.memoryImage}
        />
      ) : null}
      <Text style={[styles.cardBody, { color: surface.text }]} numberOfLines={3}>
        {title}
      </Text>
      {observation ? (
        <Text style={[styles.meta, { color: surface.faint }]}>
          {rememberedStamp(observation.capturedAt)}
        </Text>
      ) : null}
      {tags.length > 0 ? (
        <View style={styles.chipRow}>
          {tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: surface.well }]}>
              <Text style={[styles.tagLabel, { color: surface.muted }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

export function InsightWidget({
  nudge,
  surface,
  onPress,
}: {
  nudge: HomeNudge;
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
      accessibilityLabel={nudge.body}
      style={[styles.card, { backgroundColor: surface.panel, borderColor: surface.border }, press.style]}
    >
      <View style={styles.insightHead}>
        <LinearGradient colors={[cyan, azure]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.spark} />
        <Text style={[styles.kicker, { color: surface.faint }]}>Kairos noticed</Text>
      </View>
      <Text style={[styles.cardBody, { color: surface.text }]} numberOfLines={3}>
        {nudge.body}
      </Text>
      <Text style={[styles.link, { color: surface.muted }]}>Explore pattern  →</Text>
    </AnimatedPressable>
  );
}

export function MemoryRoute({
  hops,
  surface,
}: {
  hops: string[];
  surface: HomeSurface;
}) {
  if (hops.length < 2) return null;
  return (
    <View style={[styles.card, { backgroundColor: surface.panel, borderColor: surface.border }]}>
      <Text style={[styles.kicker, { color: surface.faint }]}>Connected</Text>
      <View style={styles.route}>
        {hops.map((hop, index) => (
          <View key={`${hop}-${index}`} style={styles.routeItem}>
            <Text style={[styles.routeLabel, { color: surface.text }]} numberOfLines={1}>
              {hop}
            </Text>
            {index < hops.length - 1 ? (
              <LinearGradient
                colors={[cyan, azure]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.routeLine}
              />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export function WeekPath({
  days,
  surface,
}: {
  days: Array<{ date: string; label: string; count: number }>;
  surface: HomeSurface;
}) {
  if (days.length === 0) return null;
  const max = Math.max(...days.map((day) => day.count), 1);
  const w = 280;
  const h = 56;

  return (
    <View style={[styles.card, { backgroundColor: surface.panel, borderColor: surface.border }]}>
      <Text style={[styles.kicker, { color: surface.faint }]}>This week</Text>
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        <Line x1="6" y1={h - 8} x2={w - 6} y2={h - 8} stroke={surface.border} strokeWidth={1} />
        <Line
          x1={6}
          y1={h - 10 - (days[0]!.count / max) * (h - 20)}
          x2={w - 6}
          y2={h - 10 - (days[days.length - 1]!.count / max) * (h - 20)}
          stroke={azure}
          strokeOpacity={0.15}
          strokeWidth={1}
        />
        {days.slice(1).map((day, index) => {
          const prev = days[index]!;
          const x1 = (index / Math.max(days.length - 1, 1)) * (w - 12) + 6;
          const y1 = h - 10 - (prev.count / max) * (h - 20);
          const x2 = ((index + 1) / Math.max(days.length - 1, 1)) * (w - 12) + 6;
          const y2 = h - 10 - (day.count / max) * (h - 20);
          return (
            <Line
              key={`${prev.date}-${day.date}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={index === 0 ? cyan : azure}
              strokeWidth={1.5}
            />
          );
        })}
        {days.map((day, index) => {
          const x = (index / Math.max(days.length - 1, 1)) * (w - 12) + 6;
          const y = h - 10 - (day.count / max) * (h - 20);
          return <Circle key={day.date} cx={x} cy={y} r={day.count > 0 ? 3 : 2} fill={day.count > 0 ? azure : surface.faint} />;
        })}
      </Svg>
      <View style={styles.weekLabels}>
        {days.map((day) => (
          <Text key={day.date} style={[styles.weekLabel, { color: surface.faint }]}>
            {day.label.slice(0, 1)}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function StatusLine({ text, color }: { text: string; color: string }) {
  return <Text style={[styles.status, { color }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  highlight: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    height: 196,
    borderRadius: homeShape.poster,
    overflow: 'hidden',
  },
  highlightFill: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  highlightImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  highlightShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  highlightLabel: {
    fontFamily: homeFont.serif,
    fontSize: 24,
    letterSpacing: -0.4,
    color: '#101010',
  },
  picture: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    height: 168,
    borderRadius: homeShape.poster,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    justifyContent: 'space-between',
  },
  ovalFrame: {
    width: 56,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  ovalImage: {
    width: '100%',
    height: '100%',
  },
  pictureMark: {
    alignItems: 'flex-start',
  },
  pictureLabel: {
    fontFamily: homeFont.serif,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  hero: {
    width: '100%',
    height: 228,
    borderRadius: homeShape.poster,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroKicker: {
    position: 'absolute',
    top: 14,
    left: 16,
    zIndex: 2,
    fontFamily: homeFont.sansMedium,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  metrics: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minHeight: 88,
    borderRadius: homeShape.poster,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  metricValue: {
    fontFamily: homeFont.serif,
    fontSize: 28,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  metricLabel: {
    fontFamily: homeFont.sansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  field: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  nodeLabel: {
    position: 'absolute',
    width: 104,
    textAlign: 'center',
    fontFamily: homeFont.sansMedium,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  heroTop: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
  },
  heroBottom: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    alignItems: 'flex-start',
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillLabel: {
    fontFamily: homeFont.sansMedium,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  command: {
    width: '100%',
    minHeight: 56,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commandLabel: {
    flex: 1,
    fontFamily: homeFont.sans,
    fontSize: 16,
  },
  commandTrail: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  console: {
    width: '100%',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 12,
  },
  consolePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  consoleText: {
    flex: 1,
    fontFamily: homeFont.sansSemi,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 10,
  },
  kicker: {
    fontFamily: homeFont.sansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardBody: {
    fontFamily: homeFont.sansSemi,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.15,
  },
  meta: {
    fontFamily: homeFont.sans,
    fontSize: 12,
    letterSpacing: 0.15,
  },
  link: {
    fontFamily: homeFont.sansMedium,
    fontSize: 13,
    letterSpacing: 0.15,
  },
  memoryImage: {
    width: '100%',
    height: 128,
    borderRadius: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagLabel: {
    fontFamily: homeFont.sansMedium,
    fontSize: 12,
  },
  insightHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spark: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  route: {
    gap: 8,
  },
  routeItem: {
    gap: 8,
  },
  routeLabel: {
    fontFamily: homeFont.sansBold,
    fontSize: 15,
    letterSpacing: -0.1,
  },
  routeLine: {
    height: 2,
    width: 56,
    borderRadius: 99,
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekLabel: {
    fontFamily: homeFont.sansMedium,
    fontSize: 11,
    letterSpacing: 0.3,
    width: 16,
    textAlign: 'center',
  },
  status: {
    fontFamily: homeFont.sans,
    fontSize: 12,
    letterSpacing: 0.15,
  },
});
