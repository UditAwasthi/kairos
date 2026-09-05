import React, { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { DotField } from './DotField';
import { ThemedLogo, ThemedText } from './ThemedText';
import { ThemeToggleButton } from './ThemeToggleButton';
import { ONBOARDING_SLIDES } from '../onboarding';
import { useAppTheme } from '../providers/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SLIDE_COUNT = ONBOARDING_SLIDES.length;
const SWIPE_THRESHOLD = 60;

type OnboardingCarouselProps = {
  onToggleTheme: () => void;
  onComplete?: () => void;
};

export function OnboardingCarousel({
  onToggleTheme,
  onComplete,
}: OnboardingCarouselProps) {
  const { width: slideWidth } = useWindowDimensions();
  const { colors, themeProgress, typography, spacing, radius } = useAppTheme();
  const [pageIndex, setPageIndex] = useState(0);

  const translateX = useSharedValue(0);
  const buttonPress = useSharedValue(0);
  const contextX = useSharedValue(0);

  const maxTranslate = -(SLIDE_COUNT - 1) * slideWidth;
  const isLastSlide = pageIndex === SLIDE_COUNT - 1;

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const updatePageIndex = useCallback((index: number) => {
    setPageIndex(index);
  }, []);

  useAnimatedReaction(
    () => Math.round(-translateX.value / slideWidth),
    (index, prev) => {
      if (index !== prev && index >= 0 && index < SLIDE_COUNT) {
        runOnJS(updatePageIndex)(index);
      }
    },
    [slideWidth],
  );

  const snapToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, SLIDE_COUNT - 1));
      translateX.value = withSpring(-clamped * slideWidth, {
        damping: 20,
        stiffness: 240,
        mass: 0.7,
      });
      triggerHaptic();
    },
    [translateX, triggerHaptic, slideWidth],
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-16, 16])
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      const next = contextX.value + event.translationX;
      translateX.value = Math.max(maxTranslate, Math.min(0, next));
    })
    .onEnd((event) => {
      const projected = translateX.value + event.velocityX * 0.12;
      let nextIndex = Math.round(-projected / slideWidth);

      if (
        Math.abs(event.translationX) < SWIPE_THRESHOLD &&
        Math.abs(event.velocityX) < 400
      ) {
        nextIndex = Math.round(-translateX.value / slideWidth);
      }

      nextIndex = Math.max(0, Math.min(nextIndex, SLIDE_COUNT - 1));
      const previousIndex = Math.round(-contextX.value / slideWidth);

      translateX.value = withSpring(-nextIndex * slideWidth, {
        damping: 20,
        stiffness: 240,
        mass: 0.7,
      });

      if (nextIndex !== previousIndex) {
        runOnJS(triggerHaptic)();
      }
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 }],
  }));

  const buttonScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(buttonPress.value, [0, 1], [1, 0.97]) }],
  }));

  const handleButtonPress = () => {
    if (pageIndex < SLIDE_COUNT - 1) {
      snapToIndex(pageIndex + 1);
      return;
    }
    onComplete?.();
  };

  const stepLabel = `${String(pageIndex + 1).padStart(2, '0')} / ${String(SLIDE_COUNT).padStart(2, '0')}`;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing['6'] }]}>
        <View style={styles.glyphRow}>
          <View style={[styles.redDot, { backgroundColor: colors.accent }]} />
          <ThemedText colorKey="textSecondary" style={styles.glyphLabel}>
            ONBOARDING
          </ThemedText>
        </View>
        <View style={styles.headerRight}>
          <ThemeToggleButton themeProgress={themeProgress} onToggle={onToggleTheme} />
          <ThemedText colorKey="text" style={styles.stepCounter}>
            {stepLabel}
          </ThemedText>
        </View>
      </View>

      <View style={styles.hero}>
        <DotField />
        <ThemedLogo themeProgress={themeProgress} logoStyle={logoStyle} />
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <ThemedText colorKey="text" style={styles.title}>
          KAIROS
        </ThemedText>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.carouselArea}>
          <Animated.View
            style={[styles.track, { width: slideWidth * SLIDE_COUNT }, trackStyle]}
          >
            {ONBOARDING_SLIDES.map((slide, index) => (
              <SloganSlide
                key={slide.id}
                index={index}
                width={slideWidth}
                slogan={slide.slogan}
                translateX={translateX}
              />
            ))}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <View style={[styles.controls, { paddingHorizontal: spacing['6'] }]}>
        <View style={styles.dotsRow}>
          {ONBOARDING_SLIDES.map((slide, index) => {
            const active = index === pageIndex;
            return (
              <View
                key={slide.id}
                style={{
                  height: 3,
                  width: active ? 18 : 6,
                  borderRadius: radius.sm,
                  backgroundColor: active ? colors.dot : colors.dotInactive,
                  opacity: active ? 1 : 0.45,
                }}
              />
            );
          })}
        </View>

        <AnimatedPressable
          onPress={handleButtonPress}
          onPressIn={() => {
            buttonPress.value = withSpring(1, { damping: 14, stiffness: 280 });
            triggerHaptic();
          }}
          onPressOut={() => {
            buttonPress.value = withSpring(0, { damping: 14, stiffness: 280 });
          }}
          style={[
            styles.button,
            {
              borderRadius: radius.md,
              borderColor: colors.borderActive,
              backgroundColor: isLastSlide ? colors.buttonPressedFill : colors.buttonFill,
            },
            buttonScaleStyle,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: isLastSlide ? colors.buttonPressedText : colors.buttonText,
                fontSize: typography.bodySmall.size,
              },
            ]}
          >
            {isLastSlide ? 'GET STARTED' : 'NEXT'}
          </Text>
        </AnimatedPressable>

        <ThemedText colorKey="textMuted" style={styles.footer}>
          WELCOME TO KAIROS
        </ThemedText>
      </View>
    </View>
  );
}

type SloganSlideProps = {
  index: number;
  width: number;
  slogan: string;
  translateX: SharedValue<number>;
};

function SloganSlide({ index, width, slogan, translateX }: SloganSlideProps) {
  const contentStyle = useAnimatedStyle(() => {
    const offset = translateX.value + index * width;
    const progress = Math.abs(offset / width);

    return {
      opacity: interpolate(progress, [0, 0.8, 1], [1, 0.35, 0], Extrapolation.CLAMP),
    };
  });

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.sloganWrap, contentStyle]}>
        <ThemedText colorKey="textSecondary" style={styles.slogan}>
          {slogan}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  glyphRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  redDot: {
    width: 5,
    height: 5,
    borderRadius: 2,
  },
  glyphLabel: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 11,
    letterSpacing: 2.5,
  },
  stepCounter: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 11,
    letterSpacing: 1,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  divider: {
    width: 80,
    height: 1,
  },
  title: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 40,
    letterSpacing: 8,
  },
  carouselArea: {
    flex: 1,
    overflow: 'hidden',
    minHeight: 96,
  },
  controls: {
    paddingTop: 8,
  },
  track: {
    flexDirection: 'row',
    flex: 1,
  },
  slide: {
    justifyContent: 'center',
  },
  sloganWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  slogan: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
    letterSpacing: -0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
    height: 6,
  },
  button: {
    height: 56,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 3,
  },
});
