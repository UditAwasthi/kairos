import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { DeviceMotion } from 'expo-sensors';
import Animated, {
  Easing,
  Extrapolation,
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  FIRST_MEMORY_HINT,
  FIRST_MEMORY_PLACEHOLDER,
  FLOATING_HORIZONS,
  ONBOARDING_STEPS,
  memoryConnections,
  onboardingSurface,
  quietTagsForCapture,
  type OnboardingSurface,
} from '../onboarding';
import { useAppTheme } from '../providers/ThemeProvider';
import { ThemeToggleButton } from './ThemeToggleButton';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SLIDE_COUNT = ONBOARDING_STEPS.length;
const SWIPE_THRESHOLD = 60;
const GUTTER = 24;

function typeScale(width: number) {
  const t = Math.min(1, Math.max(0.82, width / 390));
  return {
    huge: Math.round(40 * t),
    mid: Math.round(32 * t),
    focus: Math.round(28 * t),
    echo: Math.round(18 * t),
    float: t,
  };
}

const enterTiming = { duration: 480, easing: Easing.out(Easing.cubic) };
const gyroSpring = { damping: 16, stiffness: 190, mass: 0.7 };

type GyroTilt = {
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
};

const GyroTiltContext = createContext<GyroTilt | null>(null);

function clampTilt(value: number) {
  return Math.max(-1, Math.min(1, value));
}

function useGyroTiltSource(): GyroTilt {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let subscription: { remove: () => void } | undefined;
    let cancelled = false;
    let restBeta: number | null = null;
    let restGamma: number | null = null;

    const start = async () => {
      const available = await DeviceMotion.isAvailableAsync();
      if (!available || cancelled) return;

      const existing = await DeviceMotion.getPermissionsAsync();
      const permission = existing.granted
        ? existing
        : await DeviceMotion.requestPermissionsAsync();
      if (!permission.granted || cancelled) return;

      DeviceMotion.setUpdateInterval(80);
      subscription = DeviceMotion.addListener((data) => {
        const beta = data.rotation?.beta ?? 0;
        const gamma = data.rotation?.gamma ?? 0;
        if (restBeta == null || restGamma == null) {
          restBeta = beta;
          restGamma = gamma;
          return;
        }
        tiltX.value = withSpring(clampTilt((gamma - restGamma) * 5.2), gyroSpring);
        tiltY.value = withSpring(clampTilt((beta - restBeta) * 4.6), gyroSpring);
      });
    };

    void start();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [tiltX, tiltY]);

  return { tiltX, tiltY };
}

function useGyroTilt(): GyroTilt {
  const tilt = useContext(GyroTiltContext);
  if (!tilt) {
    throw new Error('Gyro tilt is missing.');
  }
  return tilt;
}

function GyroLayer({
  children,
  style,
  depth = 1,
  rotate = 1,
}: {
  children?: React.ReactNode;
  style?: object;
  depth?: number;
  rotate?: number;
}) {
  const { tiltX, tiltY } = useGyroTilt();
  const animated = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${-tiltY.value * 9 * rotate}deg` },
      { rotateY: `${tiltX.value * 11 * rotate}deg` },
      { translateX: tiltX.value * 16 * depth },
      { translateY: tiltY.value * 12 * depth },
    ],
  }));

  return (
    <Animated.View pointerEvents="box-none" style={[style, animated]}>
      {children}
    </Animated.View>
  );
}

function FadeRise({
  active,
  delay = 0,
  children,
  style,
}: {
  active: boolean;
  delay?: number;
  children: React.ReactNode;
  style?: object;
}) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(active ? 1 : 0.16, enterTiming));
  }, [active, delay, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [16, 0]) }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

function DriftBlob({
  color,
  style,
  depth = 1.5,
}: {
  color: string;
  style: object;
  depth?: number;
}) {
  const drift = useSharedValue(0);
  const { tiltX, tiltY } = useGyroTilt();

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 7400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift]);

  const animated = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateX: `${-tiltY.value * 14 * depth}deg` },
      { rotateY: `${tiltX.value * 16 * depth}deg` },
      { translateX: interpolate(drift.value, [0, 1], [0, 12]) + tiltX.value * 28 * depth },
      { translateY: interpolate(drift.value, [0, 1], [0, -10]) + tiltY.value * 22 * depth },
      { scale: interpolate(drift.value, [0, 1], [1, 1.05]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.blob, style, { backgroundColor: color }, animated]}
    />
  );
}

type OnboardingCarouselProps = {
  onToggleTheme?: () => void;
  onComplete?: () => void;
};

export function OnboardingCarousel({ onToggleTheme, onComplete }: OnboardingCarouselProps) {
  const gyroTilt = useGyroTiltSource();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, isLight, typography, radius, motion, toggleTheme } = useAppTheme();
  const surface = onboardingSurface(colors, isLight);
  const [pageIndex, setPageIndex] = useState(0);
  const [horizons, setHorizons] = useState<string[]>([]);
  const [firstMemory, setFirstMemory] = useState('');

  const translateX = useSharedValue(0);
  const buttonPress = useSharedValue(0);
  const contextX = useSharedValue(0);
  const maxTranslate = -(SLIDE_COUNT - 1) * width;
  const toggle = onToggleTheme ?? toggleTheme;

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const updatePageIndex = useCallback((index: number) => {
    setPageIndex(index);
  }, []);

  useAnimatedReaction(
    () => Math.round(-translateX.value / width),
    (index, prev) => {
      if (index !== prev && index >= 0 && index < SLIDE_COUNT) {
        runOnJS(updatePageIndex)(index);
      }
    },
    [width],
  );

  const snapToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, SLIDE_COUNT - 1));
      translateX.value = withSpring(-clamped * width, {
        damping: 20,
        stiffness: 210,
        mass: 0.85,
      });
      triggerHaptic();
    },
    [translateX, triggerHaptic, width],
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-18, 18])
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = Math.max(maxTranslate, Math.min(0, contextX.value + event.translationX));
    })
    .onEnd((event) => {
      const projected = translateX.value + event.velocityX * 0.12;
      let nextIndex = Math.round(-projected / width);
      if (Math.abs(event.translationX) < SWIPE_THRESHOLD && Math.abs(event.velocityX) < 400) {
        nextIndex = Math.round(-translateX.value / width);
      }
      nextIndex = Math.max(0, Math.min(nextIndex, SLIDE_COUNT - 1));
      const previousIndex = Math.round(-contextX.value / width);
      translateX.value = withSpring(-nextIndex * width, {
        damping: 20,
        stiffness: 210,
        mass: 0.85,
      });
      if (nextIndex !== previousIndex) runOnJS(triggerHaptic)();
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const buttonScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(buttonPress.value, [0, 1], [1, motion.pressScale]) }],
  }));

  const cta = ONBOARDING_STEPS[pageIndex]?.cta ?? null;
  const rememberCta = pageIndex === 2;

  const handleCta = () => {
    if (pageIndex < SLIDE_COUNT - 1) {
      snapToIndex(pageIndex + 1);
      return;
    }
    onComplete?.();
  };

  const toggleHorizon = (name: string) => {
    triggerHaptic();
    setHorizons((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  };

  const tags = useMemo(
    () => quietTagsForCapture(firstMemory, horizons),
    [firstMemory, horizons],
  );
  const links = useMemo(
    () => memoryConnections(firstMemory, horizons),
    [firstMemory, horizons],
  );
  const scale = typeScale(width);
  const ctaShift = useSharedValue(1);

  useEffect(() => {
    ctaShift.value = 0;
    ctaShift.value = withTiming(1, enterTiming);
  }, [cta, ctaShift]);

  const ctaEnterStyle = useAnimatedStyle(() => ({
    opacity: ctaShift.value,
    transform: [{ translateY: interpolate(ctaShift.value, [0, 1], [10, 0]) }],
  }));

  return (
    <GyroTiltContext.Provider value={gyroTilt}>
    <View style={[styles.root, { backgroundColor: surface.canvas }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.stage, { paddingTop: insets.top, paddingBottom: insets.bottom + 18 }]}>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.carousel}>
              <Animated.View style={[styles.track, { width: width * SLIDE_COUNT }, trackStyle]}>
                <OpeningScene
                  index={0}
                  width={width}
                  height={height}
                  translateX={translateX}
                  surface={surface}
                  scale={scale}
                  isLight={isLight}
                  onToggleTheme={toggle}
                  active={pageIndex === 0}
                />
                <MattersScene
                  index={1}
                  width={width}
                  height={height}
                  translateX={translateX}
                  surface={surface}
                  scale={scale}
                  selected={horizons}
                  onToggle={toggleHorizon}
                  active={pageIndex === 1}
                />
                <CaptureScene
                  index={2}
                  width={width}
                  height={height}
                  translateX={translateX}
                  surface={surface}
                  scale={scale}
                  value={firstMemory}
                  onChangeText={setFirstMemory}
                  tags={tags}
                  active={pageIndex === 2}
                />
                <ConnectedScene
                  index={3}
                  width={width}
                  height={height}
                  translateX={translateX}
                  surface={surface}
                  scale={scale}
                  memory={links.memory}
                  focus={links.focus}
                  related={links.related}
                  evidence={links.evidence}
                  active={pageIndex === 3}
                />
                <EnterScene
                  index={4}
                  width={width}
                  height={height}
                  translateX={translateX}
                  surface={surface}
                  scale={scale}
                  memory={links.memory}
                  focus={links.focus}
                  related={links.related}
                  active={pageIndex === 4}
                />
              </Animated.View>
            </Animated.View>
          </GestureDetector>

          <View style={[styles.ctaRow, { paddingHorizontal: GUTTER }]}>
            <ProgressMarks index={pageIndex} surface={surface} />
            {cta ? (
              <Animated.View style={ctaEnterStyle}>
                <AnimatedPressable
                  onPress={handleCta}
                  onPressIn={() => {
                    buttonPress.value = withSpring(1, { damping: 16, stiffness: 260 });
                    triggerHaptic();
                  }}
                  onPressOut={() => {
                    buttonPress.value = withSpring(0, { damping: 16, stiffness: 260 });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={cta}
                  style={[
                    styles.pillCta,
                    {
                      backgroundColor: rememberCta ? surface.remember : surface.cta,
                      borderRadius: radius.full,
                    },
                    buttonScaleStyle,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillCtaText,
                      {
                        color: rememberCta ? surface.rememberText : surface.ctaText,
                        fontFamily: typography.bodySmall.fontFamily,
                      },
                    ]}
                  >
                    {cta}
                  </Text>
                </AnimatedPressable>
              </Animated.View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
    </GyroTiltContext.Provider>
  );
}

type TypeScale = ReturnType<typeof typeScale>;

type SceneProps = {
  index: number;
  width: number;
  height: number;
  translateX: SharedValue<number>;
  surface: OnboardingSurface;
  scale: TypeScale;
  active: boolean;
};

function ProgressMarks({
  index,
  surface,
}: {
  index: number;
  surface: OnboardingSurface;
}) {
  return (
    <View style={styles.progressRow} accessibilityRole="progressbar">
      {ONBOARDING_STEPS.map((step, stepIndex) => (
        <ProgressDot
          key={step.id}
          active={stepIndex === index}
          reached={stepIndex <= index}
          surface={surface}
        />
      ))}
    </View>
  );
}

function ProgressDot({
  active,
  reached,
  surface,
}: {
  active: boolean;
  reached: boolean;
  surface: OnboardingSurface;
}) {
  const fill = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    fill.value = withSpring(active ? 1 : 0, { damping: 16, stiffness: 180 });
  }, [active, fill]);

  const style = useAnimatedStyle(() => ({
    width: interpolate(fill.value, [0, 1], [5, 16]),
    backgroundColor: active || reached ? surface.lavenderInk : surface.line,
    opacity: interpolate(fill.value, [0, 1], [reached ? 0.45 : 0.28, 1]),
  }));

  return <Animated.View style={[styles.progressDot, style]} />;
}

function SceneShell({
  index,
  width,
  translateX,
  children,
  align = 'start',
}: SceneProps & { children: React.ReactNode; align?: 'start' | 'end' }) {
  const { tiltX, tiltY } = useGyroTilt();
  const contentStyle = useAnimatedStyle(() => {
    const progress = Math.abs((translateX.value + index * width) / width);
    return {
      opacity: interpolate(progress, [0, 0.7, 1], [1, 0.2, 0], Extrapolation.CLAMP),
      transform: [
        { perspective: 1000 },
        { rotateX: `${-tiltY.value * 8}deg` },
        { rotateY: `${tiltX.value * 10}deg` },
        {
          translateX:
            interpolate(progress, [0, 1], [0, 12], Extrapolation.CLAMP) + tiltX.value * 12,
        },
        { translateY: tiltY.value * 10 },
        { scale: interpolate(progress, [0, 1], [1, 0.985], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View
        style={[
          styles.slideInner,
          { justifyContent: align === 'end' ? 'flex-end' : 'flex-start' },
          contentStyle,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

function OpeningScene({
  isLight,
  onToggleTheme,
  ...props
}: SceneProps & { isLight: boolean; onToggleTheme: () => void }) {
  const { themeProgress } = useAppTheme();
  return (
    <SceneShell {...props} align="end">
      <DriftBlob color={props.surface.blob} style={styles.blobIntro} depth={1.6} />
      <View style={styles.introTop}>
        <Image
          source={isLight ? require('../assets/logo-dark.png') : require('../assets/logo-light.png')}
          style={styles.mark}
          resizeMode="contain"
          accessibilityLabel="Kairos"
        />
        <ThemeToggleButton themeProgress={themeProgress} onToggle={onToggleTheme} />
      </View>
      <View style={styles.introCopy}>
        <FadeRise active={props.active} delay={40}>
          <Text
            style={[
              styles.displayHuge,
              {
                color: props.surface.text,
                fontSize: props.scale.huge,
                lineHeight: props.scale.huge + 8,
              },
            ]}
          >
            {ONBOARDING_STEPS[0].statement}
          </Text>
        </FadeRise>
        <FadeRise active={props.active} delay={160}>
          <Text style={[styles.whisper, { color: props.surface.muted }]}>
            {ONBOARDING_STEPS[0].mark}
          </Text>
        </FadeRise>
        <FadeRise active={props.active} delay={240}>
          <Text style={[styles.ideaLine, { color: props.surface.muted }]}>
            {ONBOARDING_STEPS[0].hint}
          </Text>
        </FadeRise>
      </View>
    </SceneShell>
  );
}

function MattersScene({
  selected,
  onToggle,
  ...props
}: SceneProps & { selected: string[]; onToggle: (name: string) => void }) {
  return (
    <SceneShell {...props}>
      <FadeRise active={props.active}>
        <Text
          style={[
            styles.displayCrop,
            {
              color: props.surface.text,
              fontSize: props.scale.huge,
              lineHeight: props.scale.huge + 8,
            },
          ]}
        >
          {ONBOARDING_STEPS[1].title}
        </Text>
        <Text style={[styles.ideaLine, { color: props.surface.muted }]}>
          {ONBOARDING_STEPS[1].hint}
        </Text>
      </FadeRise>
      <View style={styles.floatStage}>
        <Text style={[styles.whisper, styles.keptLabel, { color: props.surface.muted }]}>
          {selected.length > 0 ? `${selected.length} kept` : 'Kept'}
        </Text>
        <Text style={[styles.whisper, styles.moreLabel, { color: props.surface.muted }]}>
          More
        </Text>
        {FLOATING_HORIZONS.map((word, index) => (
          <FloatingHorizon
            key={word.name}
            word={word}
            index={index}
            selected={selected.includes(word.name)}
            selectedOrder={selected.indexOf(word.name)}
            selectedCount={selected.length}
            width={props.width - GUTTER * 2}
            height={Math.max(260, props.height * 0.48)}
            scale={props.scale.float}
            surface={props.surface}
            active={props.active}
            onPress={() => onToggle(word.name)}
          />
        ))}
      </View>
    </SceneShell>
  );
}

function FloatingHorizon({
  word,
  index,
  selected,
  selectedOrder,
  selectedCount,
  width,
  height,
  scale,
  surface,
  active: sceneActive,
  onPress,
}: {
  word: (typeof FLOATING_HORIZONS)[number];
  index: number;
  selected: boolean;
  selectedOrder: number;
  selectedCount: number;
  width: number;
  height: number;
  scale: number;
  surface: OnboardingSurface;
  active: boolean;
  onPress: () => void;
}) {
  const active = useSharedValue(selected ? 1 : 0);
  const gather = useSharedValue(selectedCount > 0 ? 1 : 0);
  const arrive = useSharedValue(0);

  useEffect(() => {
    active.value = withSpring(selected ? 1 : 0, { damping: 18, stiffness: 150 });
  }, [active, selected]);

  useEffect(() => {
    gather.value = withSpring(selectedCount > 0 ? 1 : 0, { damping: 18, stiffness: 140 });
  }, [gather, selectedCount]);

  useEffect(() => {
    arrive.value = withDelay(
      80 + index * 50,
      withTiming(sceneActive ? 1 : 0.2, enterTiming),
    );
  }, [arrive, index, sceneActive]);

  const restX = Math.max(0, Math.min(word.x * width, width - 132));
  const restY = Math.max(height * 0.34, Math.min(word.y * height, height - 40));
  const order = Math.max(0, selectedOrder);
  const clusterX = (order % 2) * Math.min(width * 0.46, 150);
  const clusterY = 22 + Math.floor(order / 2) * 34;
  const depth = 0.55 + (index % 3) * 0.35;
  const { tiltX, tiltY } = useGyroTilt();

  const style = useAnimatedStyle(() => ({
    opacity: arrive.value,
    transform: [
      { perspective: 800 },
      {
        translateX:
          interpolate(active.value, [0, 1], [restX, clusterX]) + tiltX.value * 20 * depth,
      },
      {
        translateY:
          interpolate(
            active.value,
            [0, 1],
            [restY, clusterY - interpolate(gather.value, [0, 1], [0, 6])],
          ) + tiltY.value * 16 * depth,
      },
      { rotateX: `${-tiltY.value * 6 * depth}deg` },
      { rotateY: `${tiltX.value * 8 * depth}deg` },
      { scale: interpolate(active.value, [0, 1], [1, 1.08]) },
    ],
  }));

  return (
    <Animated.View style={[styles.floatWord, style]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={word.name}
      >
        <Text
          style={{
            fontFamily: selected ? 'PlayfairDisplay_500Medium' : 'PlayfairDisplay_400Regular',
            fontSize: Math.round((selected ? word.size + 4 : word.size) * scale),
            letterSpacing: -0.6,
            color: selected ? surface.lavenderInk : surface.muted,
          }}
        >
          {word.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function CaptureScene({
  value,
  onChangeText,
  tags,
  ...props
}: SceneProps & {
  value: string;
  onChangeText: (text: string) => void;
  tags: string[];
}) {
  return (
    <SceneShell {...props}>
      <DriftBlob color={props.surface.blob} style={styles.blobCapture} depth={1.35} />
      <FadeRise active={props.active}>
        <Text
          style={[
            styles.displayMid,
            {
              color: props.surface.text,
              fontSize: props.scale.mid,
              lineHeight: props.scale.mid + 8,
            },
          ]}
        >
          {ONBOARDING_STEPS[2].title}
        </Text>
        <Text style={[styles.ideaLine, { color: props.surface.muted }]}>
          {FIRST_MEMORY_HINT}
        </Text>
      </FadeRise>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline
        autoCorrect={false}
        accessibilityLabel={FIRST_MEMORY_PLACEHOLDER}
        placeholder={FIRST_MEMORY_PLACEHOLDER}
        placeholderTextColor={props.surface.muted}
        selectionColor={props.surface.lavenderInk}
        style={[
          styles.captureInput,
          {
            color: props.surface.text,
            fontSize: props.scale.mid - 4,
            lineHeight: props.scale.mid + 4,
            minHeight: Math.min(180, props.height * 0.24),
          },
        ]}
      />
      {tags.length > 0 ? (
        <View style={styles.tinyRow}>
          {tags.map((tag, index) => (
            <FadeRise key={tag} active={props.active} delay={120 + index * 70}>
              <Text style={[styles.tinyMeta, { color: props.surface.muted }]}>
                {tag}
              </Text>
            </FadeRise>
          ))}
        </View>
      ) : null}
    </SceneShell>
  );
}

function ConnectedScene({
  memory,
  focus,
  related,
  evidence,
  ...props
}: SceneProps & { memory: string; focus: string; related: string[]; evidence: string }) {
  return (
    <SceneShell {...props} align="start">
      <FadeRise active={props.active}>
        <Text
          style={[
            styles.displayMid,
            {
              color: props.surface.text,
              fontSize: props.scale.mid,
              lineHeight: props.scale.mid + 8,
            },
          ]}
        >
          {ONBOARDING_STEPS[3].title}
        </Text>
        <Text style={[styles.ideaLine, { color: props.surface.muted }]}>
          {ONBOARDING_STEPS[3].hint}
        </Text>
      </FadeRise>
      <GyroLayer depth={0.85} rotate={0.7} style={styles.connectTree}>
        <FadeRise active={props.active} delay={80}>
          <Text
            style={[
              styles.memoryEcho,
              {
                color: props.surface.muted,
                fontSize: props.scale.echo,
                lineHeight: props.scale.echo + 8,
              },
            ]}
            numberOfLines={2}
          >
            {memory}
          </Text>
        </FadeRise>
        <View style={[styles.connectSpine, { backgroundColor: props.surface.lavender }]} />
        <FadeRise active={props.active} delay={180}>
          <Text
            style={[
              styles.focusWord,
              {
                color: props.surface.lavenderInk,
                fontSize: props.scale.focus,
                lineHeight: props.scale.focus + 8,
              },
            ]}
          >
            {focus}
          </Text>
        </FadeRise>
        <View style={[styles.connectSpine, { backgroundColor: props.surface.lavender }]} />
        <View style={styles.connectBranches}>
          {related.map((name, index) => (
            <FadeRise key={name} active={props.active} delay={260 + index * 70}>
              <Text style={[styles.relatedWord, { color: props.surface.text }]}>{name}</Text>
            </FadeRise>
          ))}
        </View>
      </GyroLayer>
      <FadeRise active={props.active} delay={360}>
        <Text style={[styles.whisper, { color: props.surface.muted, marginTop: 20 }]}>
          {evidence}
        </Text>
      </FadeRise>
    </SceneShell>
  );
}

function EnterScene({
  memory,
  related,
  ...props
}: SceneProps & { memory: string; focus: string; related: string[] }) {
  return (
    <SceneShell {...props} align="end">
      <DriftBlob color={props.surface.blob} style={styles.blobEnter} depth={1.7} />
      {related.map((name, index) => (
        <FadeRise
          key={name}
          active={props.active}
          delay={120 + index * 80}
          style={[styles.enterFragment, enterFragmentSlot(index)]}
        >
          <GyroLayer depth={1.45} rotate={0.8}>
            <Text style={[styles.tinyMeta, { color: props.surface.muted }]}>{name}</Text>
          </GyroLayer>
        </FadeRise>
      ))}
      <FadeRise active={props.active} delay={80}>
        <GyroLayer depth={0.9} rotate={1.1}>
        <View
          style={[
            styles.keptPanel,
            {
              backgroundColor: props.surface.lavender,
              borderColor: props.surface.line,
            },
          ]}
        >
          <Text style={[styles.whisper, { color: props.surface.lavenderInk }]}>Kept</Text>
          <Text
            style={[
              styles.keptBody,
              {
                color: props.surface.text,
                fontSize: props.scale.echo + 2,
                lineHeight: props.scale.echo + 10,
              },
            ]}
            numberOfLines={4}
          >
            {memory}
          </Text>
        </View>
        </GyroLayer>
      </FadeRise>
      <FadeRise active={props.active} delay={220}>
        <Text
          style={[
            styles.displayHuge,
            {
              color: props.surface.text,
              fontSize: props.scale.huge,
              lineHeight: props.scale.huge + 8,
              marginTop: 22,
            },
          ]}
        >
          {ONBOARDING_STEPS[4].statement}
        </Text>
        <Text style={[styles.ideaLine, { color: props.surface.muted }]}>
          {ONBOARDING_STEPS[4].hint}
        </Text>
      </FadeRise>
    </SceneShell>
  );
}

function enterFragmentSlot(index: number) {
  const slots = [
    { top: 28, right: 8 },
    { top: 86, left: 4 },
    { top: 148, right: 18 },
  ] as const;
  return slots[index] ?? slots[0];
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  stage: { flex: 1 },
  carousel: { flex: 1, overflow: 'hidden' },
  track: { flexDirection: 'row', flex: 1 },
  slide: { flex: 1, overflow: 'hidden' },
  slideInner: { flex: 1, paddingBottom: 12, paddingHorizontal: GUTTER },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobIntro: { width: 260, height: 300, top: -30, right: -90 },
  blobCapture: { width: 180, height: 220, top: 72, right: -70 },
  blobEnter: { width: 280, height: 280, top: -60, left: -110 },
  introTop: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mark: { width: 26, height: 26 },
  introCopy: { paddingBottom: 8, gap: 14 },
  displayHuge: {
    fontFamily: 'PlayfairDisplay_400Regular',
    letterSpacing: -1.1,
  },
  displayCrop: {
    fontFamily: 'PlayfairDisplay_400Regular',
    letterSpacing: -1.1,
    marginTop: 28,
  },
  displayMid: {
    fontFamily: 'PlayfairDisplay_400Regular',
    letterSpacing: -0.8,
    marginTop: 28,
  },
  whisper: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  ideaLine: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    letterSpacing: -0.1,
    marginTop: 8,
  },
  floatStage: { flex: 1, minHeight: 240, marginTop: 10 },
  floatWord: { position: 'absolute' },
  keptLabel: { position: 'absolute', top: 0, left: 0 },
  moreLabel: { position: 'absolute', top: '34%', left: 0 },
  captureInput: {
    marginTop: 22,
    width: '100%',
    fontFamily: 'PlayfairDisplay_400Regular',
    letterSpacing: -0.4,
    textAlignVertical: 'top',
  },
  tinyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  tinyMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  memoryEcho: {
    fontFamily: 'PlayfairDisplay_400Regular',
    letterSpacing: -0.2,
  },
  focusWord: {
    fontFamily: 'PlayfairDisplay_400Regular',
    letterSpacing: -0.6,
  },
  connectTree: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 18,
    gap: 12,
  },
  connectSpine: {
    width: 1,
    height: 22,
    marginLeft: 8,
    opacity: 0.8,
  },
  connectBranches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
  },
  relatedWord: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  keptPanel: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 10,
  },
  keptBody: {
    fontFamily: 'PlayfairDisplay_400Regular',
    letterSpacing: -0.3,
  },
  enterFragment: {
    position: 'absolute',
  },
  ctaRow: { paddingTop: 8, gap: 14 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 8,
  },
  progressDot: {
    height: 5,
    borderRadius: 999,
  },
  pillCta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  pillCtaText: {
    fontSize: 15,
    letterSpacing: 0.15,
  },
});
