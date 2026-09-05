import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import { ThemedButton } from './ThemedButton';
import { SurfaceCard } from './SectionHeader';
import { TextAction } from './TextAction';

type PaywallProps = {
  feature: string;
  value: string;
  requiredPlan: string;
  onUpgrade: () => void;
  onRestore: () => void;
  restoreMessage?: string | null;
};

export function Paywall({
  feature,
  value,
  requiredPlan,
  onUpgrade,
  onRestore,
  restoreMessage,
}: PaywallProps) {
  const { colors, typography, spacing, radius } = useAppTheme();

  return (
    <SurfaceCard elevated style={{ gap: spacing['4'] }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: radius.md,
          backgroundColor: colors.accentGlow,
          borderWidth: 1,
          borderColor: colors.borderAccent,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing['1'],
        }}
      >
        <ThemedText colorKey="accent" style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }}>
          +
        </ThemedText>
      </View>
      <ThemedText
        colorKey="textMuted"
        style={{
          fontFamily: 'DotGothic16_400Regular',
          fontSize: typography.overline.size,
          letterSpacing: typography.overline.letterSpacing,
          textTransform: 'uppercase',
        }}
      >
        Requires {requiredPlan}
      </ThemedText>
      <ThemedText
        colorKey="text"
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: typography.title2.size - 2,
          letterSpacing: -0.5,
          lineHeight: typography.title2.lineHeight,
        }}
      >
        {feature}
      </ThemedText>
      <ThemedText
        colorKey="textSecondary"
        style={{
          fontFamily: 'Inter_400Regular',
          fontSize: typography.bodySmall.size,
          lineHeight: typography.bodySmall.lineHeight + 2,
          letterSpacing: -0.1,
        }}
      >
        {value}
      </ThemedText>
      <View style={{ marginTop: spacing['1'] }}>
        <ThemedButton label="View plans" onPress={onUpgrade} />
      </View>
      <TextAction
        label="Restore purchases"
        onPress={onRestore}
        style={{ textAlign: 'center', alignSelf: 'center' }}
      />
      {restoreMessage ? (
        <ThemedText
          colorKey="textMuted"
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: typography.caption.size,
            lineHeight: 18,
            textAlign: 'center',
            letterSpacing: -0.1,
          }}
        >
          {restoreMessage}
        </ThemedText>
      ) : null}
    </SurfaceCard>
  );
}

type StepperProps = {
  label: string;
  valueLabel: string;
  onDecrement: () => void;
  onIncrement: () => void;
};

export function Stepper({ label, valueLabel, onDecrement, onIncrement }: StepperProps) {
  const { colors, typography, spacing, radius } = useAppTheme();

  return (
    <View style={{ gap: spacing['2'], marginBottom: spacing['3'] }}>
      <ThemedText
        colorKey="textMuted"
        style={{
          fontFamily: 'DotGothic16_400Regular',
          fontSize: typography.overline.size,
          letterSpacing: typography.overline.letterSpacing,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </ThemedText>
      <View style={styles.stepControls}>
        <Pressable onPress={onDecrement} accessibilityLabel={`Decrease ${label}`}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.md,
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: colors.borderActive,
              backgroundColor: colors.surfaceElevated,
            }}
          >
            <ThemedText colorKey="text" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 20 }}>
              −
            </ThemedText>
          </View>
        </Pressable>
        <ThemedText colorKey="text" style={{ fontFamily: 'Inter_700Bold', fontSize: typography.title3.size }}>
          {valueLabel}
        </ThemedText>
        <Pressable onPress={onIncrement} accessibilityLabel={`Increase ${label}`}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.md,
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: colors.borderActive,
              backgroundColor: colors.surfaceElevated,
            }}
          >
            <ThemedText colorKey="text" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 20 }}>
              +
            </ThemedText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});