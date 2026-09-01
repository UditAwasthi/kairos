import React, { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { DotField } from './DotField';
import { ThemedLogo, ThemedText } from './ThemedText';
import { ThemeToggleButton } from './ThemeToggleButton';
import { ONBOARDING_SLIDES } from '../onboarding';
import { nothing } from '../theme';
import { themeColor } from '../themeAnimation';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SLIDE_COUNT = ONBOARDING_SLIDES.length;
const SWIPE_THRESHOLD = 60;

type OnboardingCarouselProps = {
  dotPhase: SharedValue<number>;
  logoFloat: SharedValue<number>;
  themeProgress: SharedValue<number>;
  onToggleTheme: () => void;
  onComplete?: () => void;
};

export function OnboardingCarousel({
  dotPhase,
  logoFloat,
  themeProgress,
  onToggleTheme,
  onComplete,
}: OnboardingCarouselProps) {
  const { width: slideWidth } = useWindowDimensions();
  const [pageIndex, setPageIndex] = useState(0);

  const translateX = useSharedValue(0);
  const currentIndex = useSharedValue(0);
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
      if (index !== prev) {
        runOnJS(updatePageIndex)(index);
      }
    },
    [slideWidth]
  );

  const snapToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, SLIDE_COUNT - 1));
      currentIndex.value = clamped;
      translateX.value = withSpring(-clamped * slideWidth, {
        damping: 22,
        stiffness: 220,
        mass: 0.8,
      });
      triggerHaptic();
    },
    [currentIndex, translateX, triggerHaptic, slideWidth]
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

      currentIndex.value = nextIndex;
      translateX.value = withSpring(-nextIndex * slideWidth, {
        damping: 22,
        stiffness: 220,
        mass: 0.8,
      });

      if (nextIndex !== previousIndex) {
        runOnJS(triggerHaptic)();
      }
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => {
    const t = themeProgress.value;

    return {
      transform: [
        { scale: interpolate(buttonPress.value, [0, 1], [1, 0.97]) },
      ],
      backgroundColor: interpolateColor(
        buttonPress.value,
        [0, 1],
        [themeColor(t, 'buttonFill'), themeColor(t, 'buttonPressedFill')]
      ),
      borderColor: interpolateColor(
        buttonPress.value,
        [0, 1],
        [themeColor(t, 'borderActive'), themeColor(t, 'buttonPressedFill')]
      ),
    };
  });

  const buttonTextStyle = useAnimatedStyle(() => {
    const t = themeProgress.value;

    return {
      color: interpolateColor(
        buttonPress.value,
        [0, 1],
        [themeColor(t, 'buttonText'), themeColor(t, 'buttonPressedText')]
      ),
    };
  });

  const handlePressIn = () => {
    buttonPress.value = withSpring(1, { damping: 14, stiffness: 280 });
    triggerHaptic();
  };

  const handlePressOut = () => {
    buttonPress.value = withSpring(0, { damping: 14, stiffness: 280 });
  };

  const handleButtonPress = () => {
    if (pageIndex < SLIDE_COUNT - 1) {
      snapToIndex(pageIndex + 1);
      return;
    }

    onComplete?.();
  };

  const stepLabel = `${String(pageIndex + 1).padStart(2, '0')} / 03`;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.glyphRow}>
          <View style={styles.redDot} />
          <ThemedText
            themeProgress={themeProgress}
            colorKey="textSecondary"
            style={styles.glyphLabel}
          >
            ONBOARDING
          </ThemedText>
        </View>
        <View style={styles.headerRight}>
          <ThemeToggleButton
            themeProgress={themeProgress}
            onToggle={onToggleTheme}
          />
          <ThemedText
            themeProgress={themeProgress}
            colorKey="text"
            style={styles.stepCounter}
          >
            {stepLabel}
          </ThemedText>
        </View>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.carouselArea}>
          <Animated.View
            style={[styles.track, { width: slideWidth * SLIDE_COUNT }, trackStyle]}
          >
            {ONBOARDING_SLIDES.map((slide, index) => (
              <Slide
                key={slide.id}
                index={index}
                width={slideWidth}
                slogan={slide.slogan}
                translateX={translateX}
                dotPhase={dotPhase}
                logoFloat={logoFloat}
                themeProgress={themeProgress}
              />
            ))}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <View style={styles.controls}>
        <PageDots
          translateX={translateX}
          width={slideWidth}
          themeProgress={themeProgress}
        />

        <AnimatedPressable
          onPress={handleButtonPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.button, buttonStyle]}
        >
          <Animated.Text style={[styles.buttonText, buttonTextStyle]}>
            {isLastSlide ? 'GET STARTED' : 'NEXT'}
          </Animated.Text>
        </AnimatedPressable>

        <ThemedText
          themeProgress={themeProgress}
          colorKey="textMuted"
          style={styles.footer}
        >
         WELCOME TO KAIROS
        </ThemedText>
      </View>
    </View>
  );
}

type SlideProps = {
  index: number;
  width: number;
  slogan: string;
  translateX: SharedValue<number>;
  dotPhase: SharedValue<number>;
  logoFloat: SharedValue<number>;
  themeProgress: SharedValue<number>;
};

function Slide({
  index,
  width,
  slogan,
  translateX,
  dotPhase,
  logoFloat,
  themeProgress,
}: SlideProps) {
  const contentStyle = useAnimatedStyle(() => {
    const offset = translateX.value + index * width;
    const progress = Math.abs(offset / width);

    return {
      opacity: interpolate(
        progress,
        [0, 0.65, 1],
        [1, 0.45, 0.15],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateX: interpolate(
            progress,
            [0, 1],
            [0, offset * 0.06],
            Extrapolation.CLAMP
          ),
        },
        {
          scale: interpolate(progress, [0, 1], [1, 0.9], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const logoStyle = useAnimatedStyle(() => {
    const offset = translateX.value + index * width;
    const progress = Math.abs(offset / width);

    return {
      transform: [
        {
          scale: interpolate(progress, [0, 1], [1, 0.82], Extrapolation.CLAMP),
        },
        { translateY: interpolate(logoFloat.value, [0, 1], [0, -8]) },
      ],
    };
  });

  const lineStyle = useAnimatedStyle(() => {
    const offset = translateX.value + index * width;
    const progress = Math.abs(offset / width);

    return {
      transform: [
        {
          scaleX: interpolate(
            progress,
            [0, 0.4, 1],
            [1, 0.6, 0.3],
            Extrapolation.CLAMP
          ),
        },
      ],
      opacity: interpolate(progress, [0, 1], [1, 0.25], Extrapolation.CLAMP),
      backgroundColor: themeColor(themeProgress.value, 'divider'),
    };
  });

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.slideContent, contentStyle]}>
        <DotField phase={dotPhase} themeProgress={themeProgress} />

        <ThemedLogo themeProgress={themeProgress} logoStyle={logoStyle} />

        <Animated.View style={[styles.divider, lineStyle]} />

        <ThemedText
          themeProgress={themeProgress}
          colorKey="text"
          style={styles.title}
        >
          KAIROS
        </ThemedText>
        <ThemedText
          themeProgress={themeProgress}
          colorKey="textSecondary"
          style={styles.slogan}
        >
          {slogan}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

type PageDotsProps = {
  translateX: SharedValue<number>;
  width: number;
  themeProgress: SharedValue<number>;
};

function PageDots({ translateX, width, themeProgress }: PageDotsProps) {
  return (
    <View style={styles.dotsRow}>
      {ONBOARDING_SLIDES.map((slide, index) => (
        <PageDot
          key={slide.id}
          index={index}
          translateX={translateX}
          width={width}
          themeProgress={themeProgress}
        />
      ))}
    </View>
  );
}

type PageDotProps = {
  index: number;
  translateX: SharedValue<number>;
  width: number;
  themeProgress: SharedValue<number>;
};

function PageDot({ index, translateX, width, themeProgress }: PageDotProps) {
  const dotStyle = useAnimatedStyle(() => {
    const scrollProgress = Math.abs(translateX.value + index * width) / width;
    const t = themeProgress.value;

    return {
      width: interpolate(
        scrollProgress,
        [0, 0.5, 1],
        [20, 8, 8],
        Extrapolation.CLAMP
      ),
      opacity: interpolate(
        scrollProgress,
        [0, 0.5, 1],
        [1, 0.35, 0.35],
        Extrapolation.CLAMP
      ),
      backgroundColor: interpolateColor(
        scrollProgress,
        [0, 0.5, 1],
        [themeColor(t, 'dot'), themeColor(t, 'dotInactive'), themeColor(t, 'dotInactive')]
      ),
    };
  });

  return <Animated.View style={[styles.pageDot, dotStyle]} />;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingTop: 64,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 28,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: nothing.red,
  },
  glyphLabel: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 13,
    letterSpacing: 2,
  },
  stepCounter: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 13,
    letterSpacing: 1,
  },
  carouselArea: {
    flex: 1,
    overflow: 'hidden',
  },
  controls: {
    paddingHorizontal: 28,
  },
  track: {
    flexDirection: 'row',
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 32,
  },
  divider: {
    width: 120,
    height: 1,
    transformOrigin: 'center',
  },
  title: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 38,
    letterSpacing: 6,
  },
  slogan: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 300,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    height: 8,
  },
  pageDot: {
    height: 4,
    borderRadius: 2,
  },
  button: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    letterSpacing: 1.2,
  },
  footer: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 2,
  },
});
