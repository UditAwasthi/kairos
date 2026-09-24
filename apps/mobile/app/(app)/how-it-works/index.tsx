import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../../../components/ThemedText';
import { FadeInContent } from '../../../components/ui/EmptyState';
import { FeatureIllustration } from '../../../components/ui/FeatureIllustration';
import { GlassPanel } from '../../../components/ui/Glass';
import { SoftPage, SoftTitle } from '../../../components/ui/SoftScreen';
import {
  HOW_IT_WORKS_FEATURES,
  HOW_IT_WORKS_GROUPS,
} from '../../../lib/howItWorks';
import { useAppTheme } from '../../../providers/ThemeProvider';

export default function HowItWorksScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <FadeInContent>
      <SoftPage>
        <SoftTitle>How it works</SoftTitle>
        <ThemedText colorKey="textMuted" style={styles.lead}>
          Capture something once. Kairos keeps it, finds it, and answers from it.
        </ThemedText>

        <GlassPanel>
          <View style={styles.flow}>
            {['Capture', 'Remember', 'Ask'].map((label, index) => (
              <View key={label} style={styles.flowItem}>
                <View style={[styles.flowDot, { backgroundColor: colors.accent }]} />
                <ThemedText colorKey="text" style={styles.flowLabel}>
                  {label}
                </ThemedText>
                {index < 2 ? (
                  <Feather name="arrow-right" size={14} color={colors.textMuted} />
                ) : null}
              </View>
            ))}
          </View>
          <ThemedText colorKey="textSecondary" style={styles.flowCopy}>
            Saved, then processing, then ready. Offline notes wait on this device.
          </ThemedText>
        </GlassPanel>

        {HOW_IT_WORKS_GROUPS.map((group) => (
          <View key={group.id} style={styles.group}>
            <ThemedText colorKey="textMuted" style={styles.kicker}>
              {group.title}
            </ThemedText>
            <ThemedText colorKey="textSecondary" style={styles.groupLead}>
              {group.lead}
            </ThemedText>
            {HOW_IT_WORKS_FEATURES.filter((feature) => feature.group === group.id).map(
              (feature) => (
                <Pressable
                  key={feature.id}
                  onPress={() => router.push(`/(app)/how-it-works/${feature.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={feature.title}
                  style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
                >
                  <GlassPanel padded={false} contentStyle={styles.card}>
                    <FeatureIllustration id={feature.id} />
                    <View style={styles.copy}>
                      <ThemedText colorKey="text" style={styles.title}>
                        {feature.title}
                      </ThemedText>
                      <ThemedText colorKey="textMuted" style={styles.summary} numberOfLines={2}>
                        {feature.summary}
                      </ThemedText>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.textMuted} />
                  </GlassPanel>
                </Pressable>
              ),
            )}
          </View>
        ))}
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  flow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  flowLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  flowCopy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  group: { gap: 10 },
  kicker: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  groupLead: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  copy: { flex: 1, gap: 4 },
  title: { fontFamily: 'Inter_500Medium', fontSize: 16 },
  summary: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
});
