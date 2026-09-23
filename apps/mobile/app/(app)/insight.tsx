import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '../../components/ThemedText';
import { GlassPanel } from '../../components/ui/Glass';
import { SoftPage, SoftTitle } from '../../components/ui/SoftScreen';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ApiError, fetchTodayInsight, type TodayInsight } from '../../lib/api';
import { KairosOs } from '../../lib/osIntegrations';
import { useAppTheme } from '../../providers/ThemeProvider';

export default function InsightScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const [insight, setInsight] = useState<TodayInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) throw new ApiError('Sign in required.', 401);
        const data = await fetchTodayInsight(token);
        if (active) setInsight(data);
        void KairosOs.refreshWidget(data.body);
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'Could not load today’s insight.');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [getToken]);

  return (
    <SoftPage>
      <SoftTitle>Today</SoftTitle>
      {!insight && !error ? <ActivityIndicator color={colors.accent} /> : null}
      {insight ? (
        <GlassPanel>
          <ThemedText colorKey="textMuted" style={styles.kicker}>
            {insight.title}
          </ThemedText>
          <ThemedText colorKey="text" style={styles.body}>
            {insight.body}
          </ThemedText>
        </GlassPanel>
      ) : null}
      {error ? (
        <ThemedText colorKey="error" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
      <ThemedButton
        label="Capture"
        onPress={() => router.push('/(app)/quick-capture?source=WIDGET')}
      />
      <ThemedButton
        label="Ask Kairos"
        variant="outline"
        onPress={() => router.push('/(app)/(tabs)/ask')}
      />
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  kicker: { fontFamily: 'Inter_500Medium', fontSize: 13, marginBottom: 8 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 18, lineHeight: 26 },
  error: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
