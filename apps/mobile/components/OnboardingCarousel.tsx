import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeInUp,
  ReduceMotion,
  cancelAnimation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAppTheme } from '../providers/ThemeProvider';
import { motion } from '../theme';
import { OnboardingArt, type OnboardingArtId } from './OnboardingArt';
import { ThemeToggleButton } from './ThemeToggleButton';
import { ThemedButton } from './ui/ThemedButton';

const STEPS = [
  {
    id: 'patterns',
    title: 'Your life is full of patterns.',
    explanation: 'Daily routines and ideas connect in quiet, meaningful ways.',
  },
  {
    id: 'memory',
    title: 'Kairos remembers the important parts.',
    explanation: 'Capture notes, voice, links, and files into a private memory.',
  },
  {
    id: 'ask',
    title: 'Ask questions about your past.',
    explanation: 'Recall decisions, details, and lessons in a short conversation.',
  },
  {
    id: 'insights',
    title: 'Discover patterns over time.',
    explanation: 'See how your focus and energy shift across days and weeks.',
  },
  {
    id: 'model',
    title: 'Build your personal world model.',
    explanation: 'A private space for clarity, purpose, and self-awareness.',
  },
] as const;

const easeOut = Easing.out(Easing.cubic);

type Step = (typeof STEPS)[number];

function pageShift(translateX: number, index: number, width: number) {
  'worklet';
  return (translateX + index * width) / width;
}

function OnboardingPage({
  step,
  index,
  width,
  translateX,
  active,
}: {
  step: Step;
  index: number;
  width: number;
  translateX: SharedValue<number>;
  active: boolean;
}) {
  const { colors, typography, spacing } = useAppTheme();

  const artStyle = useAnimatedStyle(() => {
    const shift = pageShift(translateX.value, index, width);
    const dist = Math.abs(shift);
    return {
      opacity: interpolate(dist, [0, 1], [1, 0.28], Extrapolation.CLAMP),
      transform: [
        { translateX: shift * width * -0.2 },
        { scale: interpolate(dist, [0, 1], [1, 0.86], Extrapolation.CLAMP) },
      ],
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    const shift = pageShift(translateX.value, index, width);
    return {
      opacity: interpolate(Math.abs(shift), [0, 0.65], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(shift, [-1, 0, 1], [22, 0, 22], Extrapolation.CLAMP) },
        { scale: interpolate(Math.abs(shift), [0, 1], [1, 0.96], Extrapolation.CLAMP) },
      ],
    };
  });

  const bodyStyle = useAnimatedStyle(() => {
    const shift = pageShift(translateX.value, index, width);
    return {
      opacity: interpolate(Math.abs(shift), [0, 0.45], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(shift, [-1, 0, 1], [36, 0, 36], Extrapolation.CLAMP) }],
    };
  });

  return (
    <View style={[styles.page, { width, paddingHorizontal: spacing['6'] }]}>
      <Animated.View style={[styles.artWell, artStyle]}>
        <OnboardingArt id={step.id as OnboardingArtId} active={active} />
      </Animated.View>
      <Animated.Text
        accessibilityRole="header"
        style={[
          titleStyle,
          {
            color: colors.text,
            fontFamily: typography.display.fontFamily,
            fontSize: typography.display.size,
            lineHeight: typography.display.lineHeight,
            letterSpacing: typography.display.letterSpacing,
            textAlign: 'center',
            minHeight: typography.display.lineHeight * 3,
          },
        ]}
      >
        {step.title}
      </Animated.Text>
      <Animated.Text
        style={[
          bodyStyle,
          {
            color: colors.textSecondary,
            fontFamily: typography.body.fontFamily,
            fontSize: typography.body.size,
            lineHeight: typography.body.lineHeight,
            textAlign: 'center',
            marginTop: spacing['3'],
            minHeight: typography.body.lineHeight * 2,
          },
        ]}
      >
        {step.explanation}
      </Animated.Text>
    </View>
  );
}

function PageDot({
  index,
  count,
  width,
  translateX,
  activeColor,
  idleColor,
  selected,
  onPress,
}: {
  index: number;
  count: number;
  width: number;
  translateX: SharedValue<number>;
  activeColor: string;
  idleColor: string;
  selected: boolean;
  onPress: () => void;
}) {
  const press = useSharedValue(1);
  const style = useAnimatedStyle(() => {
    const dist = Math.abs(-translateX.value / width - index);
    return {
      width: interpolate(dist, [0, 1], [22, 6], Extrapolation.CLAMP),
      opacity: interpolate(dist, [0, 1], [1, 0.55], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(Math.min(dist, 1), [0, 1], [activeColor, idleColor]),
      transform: [{ scale: press.value }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.82, { duration: motion.fast });
      }}
      onPressOut={() => {
        press.value = withTiming(1, { duration: motion.fast });
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`Step ${index + 1} of ${count}`}
      hitSlop={8}
    >
      <Animated.View style={[styles.dot, style]} />
    </Pressable>
  );
}

function AmbientWash({ colors }: { colors: readonly [string, string, string] }) {
  const reducedMotion = useReducedMotion();
  const drift = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(drift);
      drift.value = 0;
      return;
    }

    drift.value = withRepeat(
      withTiming(1, { duration: 7600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(drift);
    };
  }, [drift, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(drift.value, [0, 1], [0.92, 1]),
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-16, 16]) },
      { translateY: interpolate(drift.value, [0, 1], [8, -12]) },
      { scale: interpolate(drift.value, [0, 1], [1.02, 1.08]) },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.wash, style]}>
      <LinearGradient
        colors={colors}
        locations={[0, 0.34, 0.62]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

type OnboardingCarouselProps = {
  onToggleTheme?: () => void;
  onComplete?: () => void;
};

export function OnboardingCarousel({ onToggleTheme, onComplete }: OnboardingCarouselProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, isLight, spacing, toggleTheme } = useAppTheme();
  const [index, setIndex] = useState(0);

  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);
  const toggle = onToggleTheme ?? toggleTheme;
  const isLast = index === STEPS.length - 1;
  const wash = isLight
    ? ([colors.primary, colors.background, colors.background] as const)
    : ([colors.primary, '#2A1214', colors.background] as const);

  const triggerHaptic = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goTo = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(nextIndex, STEPS.length - 1));
    setIndex(clamped);
    translateX.value = withTiming(-clamped * width, {
      duration: motion.page,
      easing: easeOut,
    });
    triggerHaptic();
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      const maxTranslate = -(STEPS.length - 1) * width;
      translateX.value = Math.max(maxTranslate, Math.min(0, contextX.value + event.translationX));
    })
    .onEnd((event) => {
      let nextIndex = Math.round(-translateX.value / width);
      if (Math.abs(event.translationX) > 60 || Math.abs(event.velocityX) > 500) {
        if (event.velocityX < -200) nextIndex = index + 1;
        else if (event.velocityX > 200) nextIndex = index - 1;
      }
      const clamped = Math.max(0, Math.min(nextIndex, STEPS.length - 1));
      runOnJS(goTo)(clamped);
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleNext = () => {
    if (isLast) {
      triggerHaptic();
      onComplete?.();
    } else {
      goTo(index + 1);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AmbientWash colors={wash} />

      <Animated.View
        entering={FadeIn.duration(motion.smooth).reduceMotion(ReduceMotion.System)}
        style={[styles.topBar, { paddingTop: insets.top + spacing['2'], paddingHorizontal: spacing['5'] }]}
      >
        <ThemeToggleButton onToggle={toggle} />
      </Animated.View>

      <Animated.View
        entering={FadeIn.duration(motion.expressive).reduceMotion(ReduceMotion.System)}
        style={[styles.stage, { marginTop: insets.top + spacing['12'] }]}
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.track, { width: width * STEPS.length }, trackStyle]}>
            {STEPS.map((step, i) => (
              <OnboardingPage
                key={step.id}
                step={step}
                index={i}
                width={width}
                translateX={translateX}
                active={i === index}
              />
            ))}
          </Animated.View>
        </GestureDetector>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(motion.expressive).delay(80).reduceMotion(ReduceMotion.System)}
        style={[styles.footer, { paddingHorizontal: spacing['6'], paddingBottom: insets.bottom + spacing['4'], gap: spacing['5'] }]}
      >
        <View style={[styles.dots, { gap: spacing['2'] }]}>
          {STEPS.map((step, i) => (
            <PageDot
              key={step.id}
              index={i}
              count={STEPS.length}
              width={width}
              translateX={translateX}
              activeColor={colors.primary}
              idleColor={colors.border}
              selected={i === index}
              onPress={() => goTo(i)}
            />
          ))}
        </View>
        <Animated.View
          key={isLast ? 'start' : 'next'}
          entering={FadeIn.duration(motion.fast).reduceMotion(ReduceMotion.System)}
        >
          <ThemedButton
            label={isLast ? 'Get Started' : 'Continue'}
            size="lg"
            variant="primary"
            onPress={handleNext}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  wash: {
    position: 'absolute',
    width: '130%',
    height: '120%',
    left: '-15%',
    top: '-8%',
  },
  dot: {
    height: 6,
    borderRadius: 999,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  stage: {
    flex: 1,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  artWell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingTop: 8,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
