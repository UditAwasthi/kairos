import React, { useEffect, useId, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAppTheme } from '../providers/ThemeProvider';
import { motion } from '../theme';
import { ThemeToggleButton } from './ThemeToggleButton';
import { ThemedButton } from './ui/ThemedButton';
import { Mascot } from './ui/system/Mascot';
import { mascotSize } from '../theme';

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
];

const easeOut = Easing.out(Easing.cubic);

function OrganicArtwork({ active }: { active: boolean }) {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const gradientId = `wave${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const breath = useSharedValue(1);

  useEffect(() => {
    if (reduced || !active) {
      breath.value = 1;
      return;
    }
    breath.value = withRepeat(
      withTiming(1.04, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [active, breath, reduced]);

  const artStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
    opacity: 0.92,
  }));

  return (
    <Animated.View style={[styles.art, artStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 360 420">
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="42%" r="55%">
            <Stop offset="0" stopColor={colors.accentLilac} stopOpacity={0.9} />
            <Stop offset="0.45" stopColor={colors.accentMorningBlue} stopOpacity={0.55} />
            <Stop offset="1" stopColor={colors.accentCream} stopOpacity={0.15} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="180" cy="190" rx="150" ry="130" fill={`url(#${gradientId})`} />
        <Ellipse cx="120" cy="150" rx="70" ry="54" fill={colors.accentCream} opacity={0.28} />
        <Ellipse cx="230" cy="230" rx="80" ry="60" fill={colors.primary} opacity={0.22} />
        <Ellipse cx="200" cy="120" rx="46" ry="36" fill={colors.accentMorningBlue} opacity={0.2} />
      </Svg>
      <View style={styles.mascotFloat}>
        <Mascot state="happy" size={mascotSize.lg} animate={active} />
      </View>
    </Animated.View>
  );
}

type OnboardingCarouselProps = {
  onToggleTheme?: () => void;
  onComplete?: () => void;
};

export function OnboardingCarousel({ onToggleTheme, onComplete }: OnboardingCarouselProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, isLight, typography, spacing, radius, toggleTheme } = useAppTheme();
  const [index, setIndex] = useState(0);
  const artHeight = height * 0.56;

  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);
  const toggle = onToggleTheme ?? toggleTheme;
  const step = STEPS[index] ?? STEPS[0];
  const isLast = index === STEPS.length - 1;

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
      <View style={[styles.artworkSlot, { height: artHeight }]}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.track, { width: width * STEPS.length }, trackStyle]}>
            {STEPS.map((item, i) => (
              <View key={item.id} style={{ width, height: artHeight }}>
                <OrganicArtwork active={i === index} />
              </View>
            ))}
          </Animated.View>
        </GestureDetector>
        <View style={[styles.topBar, { paddingTop: insets.top + spacing['2'], paddingHorizontal: spacing['5'] }]}>
          <Image
            source={isLight ? require('../assets/logo-dark.png') : require('../assets/logo-light.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Kairos"
          />
          <ThemeToggleButton onToggle={toggle} />
        </View>
      </View>

      <View style={[styles.bottom, { paddingHorizontal: spacing['6'], paddingBottom: insets.bottom + spacing['4'], gap: spacing['4'] }]}>
        <View style={[styles.dots, { gap: spacing['2'] }]}>
          {STEPS.map((item, i) => (
            <Pressable
              key={item.id}
              onPress={() => goTo(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: i === index }}
              accessibilityLabel={`Step ${i + 1} of ${STEPS.length}`}
              style={{
                width: i === index ? spacing['6'] : spacing['2'],
                height: spacing['2'],
                borderRadius: radius.full,
                backgroundColor: i === index ? colors.primary : colors.surfaceContainerHigh,
              }}
            />
          ))}
        </View>
        <Text
          style={{
            color: colors.text,
            fontFamily: typography.display.fontFamily,
            fontSize: typography.display.size,
            lineHeight: typography.display.lineHeight,
            letterSpacing: typography.display.letterSpacing,
            textAlign: 'center',
          }}
        >
          {step.title}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: typography.body.fontFamily,
            fontSize: typography.body.size,
            lineHeight: typography.body.lineHeight,
            textAlign: 'center',
          }}
        >
          {step.explanation}
        </Text>
        <ThemedButton
          label={isLast ? 'Get Started' : 'Continue'}
          size="lg"
          variant="primary"
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  artworkSlot: {
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    height: '100%',
  },
  art: {
    flex: 1,
  },
  mascotFloat: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '38%',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 90,
    height: 32,
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
