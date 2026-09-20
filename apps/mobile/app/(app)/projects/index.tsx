import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SoftPage } from '../../../components/ui/SoftScreen';
import { GlassPanel } from '../../../components/ui/Glass';
import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
  SoftRefreshBar,
} from '../../../components/ui/EmptyState';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedText } from '../../../components/ThemedText';
import { useAsync } from '../../../hooks/useAsync';
import { fetchProjects } from '../../../lib/api';

export default function ProjectsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { data, error, loading, refreshing, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    return fetchProjects({ token, limit: 100 });
  }, [getToken]);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error && !data) {
    return <ErrorState title="Unable to load" onRetry={reload} />;
  }

  return (
    <FadeInContent>
      <SoftRefreshBar active={refreshing} />
      <SoftPage>
        <ThemedButton
          label="New"
          onPress={() => router.push('/(app)/projects/new')}
          style={styles.newBtn}
        />

        {!data || data.items.length === 0 ? (
          <EmptyState
            title="None yet"
            actionLabel="New"
            onAction={() => router.push('/(app)/projects/new')}
          />
        ) : (
          data.items.map((project) => (
            <Pressable
              key={project.id}
              onPress={() => router.push(`/(app)/projects/${project.id}`)}
              style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
            >
              <GlassPanel padded={false} contentStyle={styles.row}>
                <View style={styles.copy}>
                  <ThemedText colorKey="text" style={styles.title} numberOfLines={1}>
                    {project.name}
                  </ThemedText>
                </View>
                <ThemedText colorKey="textMuted" style={styles.meta}>
                  {project.observationCount}
                </ThemedText>
              </GlassPanel>
            </Pressable>
          ))
        )}
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  newBtn: { alignSelf: 'flex-start', minWidth: 88, paddingHorizontal: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  copy: { flex: 1 },
  title: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
