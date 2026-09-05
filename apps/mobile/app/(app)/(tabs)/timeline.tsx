import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '../../../components/ThemedText';
import { TimelineItem } from '../../../components/ui/Cards';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { TextAction } from '../../../components/ui/TextAction';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { useAsync } from '../../../hooks/useAsync';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { EVENT_TYPE_LABELS } from '../../../services/mock/store';
import { eventsService } from '../../../services';
import { BehaviorEvent, EventType } from '../../../types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function eventDayKey(iso: string): string {
  return toDayKey(new Date(iso));
}

/** Last 14 calendar days, oldest → newest (today rightmost). */
function buildCalendarDays() {
  const days: { key: string; weekday: string; dayNum: number; isToday: boolean }[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      key: toDayKey(d),
      weekday: WEEKDAYS[d.getDay()]!,
      dayNum: d.getDate(),
      isToday: i === 0,
    });
  }
  return days;
}

function groupByDay(events: BehaviorEvent[]) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const map = new Map<string, BehaviorEvent[]>();
  for (const event of sorted) {
    const key = dayLabel(event.timestamp);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(event);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function TimelineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useAppTheme();
  const { data, error, loading, reload } = useAsync(() => eventsService.list(), []);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<EventType>>(new Set());

  const filterProgress = useSharedValue(0);

  useEffect(() => {
    filterProgress.value = withTiming(filtersOpen ? 1 : 0, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [filtersOpen, filterProgress]);

  const filterPanelStyle = useAnimatedStyle(() => ({
    opacity: filterProgress.value,
    maxHeight: filterProgress.value * 220,
    overflow: 'hidden' as const,
    marginBottom: filterProgress.value * spacing['2'],
  }));

  const calendarDays = useMemo(() => buildCalendarDays(), []);
  const calendarRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!filtersOpen) return;
    const id = setTimeout(() => calendarRef.current?.scrollToEnd({ animated: false }), 40);
    return () => clearTimeout(id);
  }, [filtersOpen]);

  const availableTypes = useMemo(() => {
    if (!data) return [] as EventType[];
    const set = new Set<EventType>();
    for (const e of data) set.add(e.type);
    return [...set].sort((a, b) =>
      EVENT_TYPE_LABELS[a].localeCompare(EVENT_TYPE_LABELS[b]),
    );
  }, [data]);

  const activeFilterCount =
    (selectedDayKey ? 1 : 0) + selectedTypes.size;
  const hasActiveFilters = activeFilterCount > 0;

  const filteredEvents = useMemo(() => {
    if (!data) return [];
    return data.filter((event) => {
      if (selectedDayKey && eventDayKey(event.timestamp) !== selectedDayKey) {
        return false;
      }
      if (selectedTypes.size > 0 && !selectedTypes.has(event.type)) {
        return false;
      }
      return true;
    });
  }, [data, selectedDayKey, selectedTypes]);

  const sections = useMemo(() => groupByDay(filteredEvents), [filteredEvents]);

  const toggleDay = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDayKey((prev) => (prev === key ? null : key));
  }, []);

  const toggleType = useCallback((type: EventType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDayKey(null);
    setSelectedTypes(new Set());
  }, []);

  if (loading) return <LoadingSkeleton rows={10} />;
  if (error) {
    return (
      <ErrorState title="Unable to load timeline" message={error} onRetry={reload} />
    );
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No data, no patterns yet."
        message="Record a few observations to start."
        actionLabel="Add event"
        onAction={() => router.push('/(app)/event/add')}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerRow, { paddingHorizontal: spacing['5'] }]}>
        <View style={{ flex: 1 }}>
          <ThemedText colorKey="textMuted" style={styles.eyebrow}>
            History
          </ThemedText>
          <ThemedText colorKey="text" style={styles.pageTitle}>
            Timeline
          </ThemedText>
        </View>

        <View style={styles.headerActions}>
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <ThemedText colorKey="text" style={styles.countText}>
              {filteredEvents.length}
              {hasActiveFilters ? `/${data.length}` : ''}
            </ThemedText>
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFiltersOpen((v) => !v);
            }}
            accessibilityRole="button"
            accessibilityLabel={filtersOpen ? 'Hide filters' : 'Show filters'}
            style={[
              styles.filterToggle,
              {
                borderColor: hasActiveFilters ? colors.borderAccent : colors.borderActive,
                backgroundColor: filtersOpen ? colors.surfaceElevated : colors.surface,
                borderRadius: radius.full,
              },
            ]}
          >
            <ThemedText
              colorKey={hasActiveFilters ? 'accent' : 'text'}
              style={styles.filterToggleLabel}
            >
              Filter
            </ThemedText>
            {hasActiveFilters ? (
              <View style={[styles.filterDot, { backgroundColor: colors.accent }]}>
                <ThemedText colorKey="inverseText" style={styles.filterDotText}>
                  {activeFilterCount}
                </ThemedText>
              </View>
            ) : (
              <View
                style={[
                  styles.filterChevron,
                  { backgroundColor: colors.border },
                  filtersOpen && { transform: [{ rotate: '180deg' }] },
                ]}
              />
            )}
          </Pressable>
        </View>
      </View>

      <Animated.View
        style={[
          filterPanelStyle,
          { paddingHorizontal: spacing['5'] },
        ]}
      >
        <View
          style={[
            styles.filterCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing['3'],
              gap: spacing['3'],
            },
          ]}
        >
          <ScrollView
            ref={calendarRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing['2'], paddingRight: spacing['2'] }}
          >
            {calendarDays.map((day) => {
              const selected = selectedDayKey === day.key;
              return (
                <Pressable
                  key={day.key}
                  onPress={() => toggleDay(day.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.dayCell,
                    {
                      borderRadius: radius.lg,
                      borderColor: selected ? colors.text : colors.border,
                      backgroundColor: selected ? colors.text : 'transparent',
                    },
                  ]}
                >
                  <ThemedText
                    colorKey={selected ? 'inverseText' : 'textMuted'}
                    style={styles.dayWeekday}
                  >
                    {day.weekday}
                  </ThemedText>
                  <ThemedText
                    colorKey={selected ? 'inverseText' : day.isToday ? 'accent' : 'text'}
                    style={styles.dayNum}
                  >
                    {day.dayNum}
                  </ThemedText>
                  {day.isToday && !selected ? (
                    <View style={[styles.todayMark, { backgroundColor: colors.accent }]} />
                  ) : (
                    <View style={styles.todayMarkSpacer} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing['2'], flexWrap: 'nowrap' }}
          >
            {availableTypes.map((type) => {
              const active = selectedTypes.has(type);
              return (
                <Pressable
                  key={type}
                  onPress={() => toggleType(type)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.typeChip,
                    {
                      borderRadius: radius.sm,
                      borderColor: active ? colors.borderAccent : colors.borderActive,
                      backgroundColor: active ? colors.accentGlow : 'transparent',
                      paddingHorizontal: spacing['2'],
                      paddingVertical: spacing['1'],
                    },
                  ]}
                >
                  <ThemedText
                    colorKey={active ? 'accent' : 'text'}
                    style={{
                      fontFamily: 'DotGothic16_400Regular',
                      fontSize: typography.overline.size,
                      letterSpacing: typography.overline.letterSpacing,
                      textTransform: 'uppercase',
                    }}
                  >
                    {EVENT_TYPE_LABELS[type]}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          {hasActiveFilters ? (
            <View style={styles.clearRow}>
              <TextAction label="Clear filters" onPress={clearFilters} />
            </View>
          ) : null}
        </View>
      </Animated.View>

      {filteredEvents.length === 0 ? (
        <EmptyState
          title="No matching events"
          message="Nothing matches the current day or type filters."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            {
              paddingHorizontal: spacing['5'],
              paddingBottom: insets.bottom + 96,
            },
          ]}
          renderSectionHeader={({ section: { title, data: sectionData } }) => (
            <View
              style={[
                styles.sectionHeader,
                { backgroundColor: colors.background },
              ]}
            >
              <ThemedText colorKey="textMuted" style={styles.sectionLabel}>
                {title.toUpperCase()}
              </ThemedText>
              <View
                style={[styles.sectionRule, { backgroundColor: colors.divider }]}
              />
              <ThemedText colorKey="textMuted" style={styles.sectionCount}>
                {sectionData.length}
              </ThemedText>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <TimelineItem
              event={item}
              onPress={() => router.push(`/(app)/event/${item.id}`)}
              isFirst={index === 0}
              isLast={index === section.data.length - 1}
            />
          )}
        />
      )}

      <View style={[styles.fab, { bottom: insets.bottom + 16, left: spacing['5'], right: spacing['5'] }]}>
        <ThemedButton label="Add event" onPress={() => router.push('/(app)/event/add')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 20,
    paddingBottom: 10,
    gap: 12,
  },
  eyebrow: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  pageTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 26,
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    minWidth: 28,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  countText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  filterToggleLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  filterDot: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterDotText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
  },
  filterChevron: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  filterCard: {
    borderWidth: 1,
  },
  dayCell: {
    width: 48,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  dayWeekday: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dayNum: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  todayMark: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  todayMarkSpacer: {
    width: 4,
    height: 4,
  },
  typeChip: {
    borderWidth: 1,
  },
  clearRow: {
    alignItems: 'flex-start',
  },
  list: { paddingTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 10,
  },
  sectionLabel: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  sectionRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  sectionCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  fab: {
    position: 'absolute',
  },
});
