import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import { HourlyPoint, TimeSeriesPoint, WeekdayPoint } from '../../types';
import { SurfaceCard } from './SectionHeader';

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  const { typography, spacing } = useAppTheme();

  return (
    <SurfaceCard style={{ marginBottom: spacing['3'] }}>
      <ThemedText
        colorKey="text"
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: typography.bodySmall.size + 1,
          letterSpacing: -0.2,
        }}
      >
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText
          colorKey="textMuted"
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: typography.caption.size,
            lineHeight: typography.caption.lineHeight,
            marginBottom: spacing['2'],
            letterSpacing: -0.1,
          }}
        >
          {subtitle}
        </ThemedText>
      ) : null}
      {children}
    </SurfaceCard>
  );
}

type BarSeriesProps = {
  points: { label: string; value: number }[];
  maxBars?: number;
};

const CHART_HEIGHT = 120;

/**
 * Bar heights use pixel values — RN percentage height inside flex
 * children is unreliable and was breaking ChartCards.
 */
export function SimpleBarChart({ points, maxBars = 14 }: BarSeriesProps) {
  const { colors, typography, spacing, radius, isLight } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sliced = useMemo(
    () => (points.length > maxBars ? points.slice(points.length - maxBars) : points),
    [points, maxBars],
  );
  const max = Math.max(...sliced.map((p) => p.value), 0.0001);
  const gridColor = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.09)';
  const gridLines = useMemo(() => [0.25, 0.5, 0.75], []);

  if (sliced.length === 0) {
    return (
      <View style={{ height: CHART_HEIGHT, justifyContent: 'center', marginTop: spacing['3'] }}>
        <ThemedText colorKey="textMuted" style={{ textAlign: 'center', fontSize: 12 }}>
          No data in this range
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={{ marginTop: spacing['3'] }}>
      <View style={[styles.chart, { height: CHART_HEIGHT }]}>
        {gridLines.map((f) => (
          <View
            key={f}
            pointerEvents="none"
            style={[
              styles.gridLine,
              { bottom: f * CHART_HEIGHT - StyleSheet.hairlineWidth, backgroundColor: gridColor },
            ]}
          />
        ))}
        <View style={[styles.bars, { gap: Math.max(2, spacing['1']) }]}>
          {sliced.map((p, index) => {
            const isActive = activeIndex === index;
            const barHeight = Math.max(3, Math.round((p.value / max) * CHART_HEIGHT));

            return (
              <Pressable
                key={`${p.label}-${index}`}
                style={styles.barCol}
                onPressIn={() => setActiveIndex(index)}
                onPressOut={() => setActiveIndex(null)}
                hitSlop={4}
                accessibilityLabel={`${p.label || 'value'} ${p.value}`}
              >
                {isActive ? (
                  <View
                    style={[
                      styles.valueBubble,
                      {
                        backgroundColor: colors.text,
                        bottom: barHeight + 6,
                      },
                    ]}
                  >
                    <ThemedText
                      colorKey="inverseText"
                      style={{
                        fontFamily: 'Inter_600SemiBold',
                        fontSize: 9,
                      }}
                    >
                      {formatBarValue(p.value)}
                    </ThemedText>
                  </View>
                ) : null}
                <View
                  style={{
                    width: '100%',
                    height: barHeight,
                    borderRadius: radius.sm,
                    backgroundColor: colors.text,
                    opacity: isActive ? 1 : 0.88,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={[styles.labels, { gap: Math.max(2, spacing['1']) }]}>
        {sliced.map((p, index) => (
          <View key={`${p.label}-label-${index}`} style={styles.labelCol}>
            <ThemedText
              colorKey={activeIndex === index ? 'text' : 'textMuted'}
              numberOfLines={1}
              style={{
                fontFamily: 'DotGothic16_400Regular',
                fontSize: 8,
                letterSpacing: typography.overline.letterSpacing,
                textAlign: 'center',
              }}
            >
              {p.label}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function formatBarValue(value: number): string {
  if (value > 0 && value <= 1) {
    return `${Math.round(value * 100)}%`;
  }
  if (Number.isInteger(value)) {
    return String(value);
  }
  return String(Math.round(value * 10) / 10);
}

export function timeSeriesToBars(points: TimeSeriesPoint[], labelEvery = 5) {
  return points.map((p, i) => ({
    label: i % labelEvery === 0 || i === points.length - 1 ? p.date.slice(5) : '',
    value: p.value,
  }));
}

export function weekdayToBars(points: WeekdayPoint[]) {
  return points.map((p) => ({ label: p.label, value: p.value }));
}

export function hourlyToBars(points: HourlyPoint[]) {
  // Keep full 24h axis so gaps stay meaningful (zeros = no data that hour)
  return points.map((p) => ({ label: String(p.hour), value: p.value }));
}

const styles = StyleSheet.create({
  chart: {
    position: 'relative',
    width: '100%',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    position: 'relative',
  },
  labels: {
    flexDirection: 'row',
    marginTop: 6,
  },
  labelCol: {
    flex: 1,
    alignItems: 'center',
  },
  valueBubble: {
    position: 'absolute',
    zIndex: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
