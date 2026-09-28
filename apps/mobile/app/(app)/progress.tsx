import { useAuth } from '@clerk/expo';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { fetchLeaderboard, updateProgression, buyStreakFreeze, type LeaderboardView, type ProgressionView } from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';
import { useProgression } from '../../providers/ProgressionProvider';

const COSMETICS = [
  { key: 'title.present', label: 'Present', kind: 'title', streak: 3 },
  { key: 'aura.warm', label: 'Warm', kind: 'aura', streak: 7 },
  { key: 'freeze.week', label: 'A freeze', kind: 'freeze', streak: 7 },
  { key: 'title.keeper', label: 'Keeper', kind: 'title', streak: 14 },
  { key: 'freeze.fortnight', label: 'A freeze', kind: 'freeze', streak: 14 },
  { key: 'aura.deep', label: 'Deep', kind: 'aura', streak: 30 },
];

type ProgressionPatch = {
  leaderboardVisible?: boolean;
  displayName?: string;
  equippedTitle?: string | null;
  equippedAura?: string | null;
};

export default function ProgressScreen() {
  const { getToken, userId } = useAuth();
  const { colors, radius } = useAppTheme();
  const { progression, refresh } = useProgression();
  const [leaderboard, setLeaderboard] = useState<LeaderboardView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      await refresh();
      const token = await getToken();
      if (!token) return;
      setLeaderboard(await fetchLeaderboard({ token, scope: 'global' }));
    } catch { setError(true); } finally { setLoading(false); }
  }, [getToken, refresh]);

  useFocusEffect(useCallback(() => {
    void load();
    if (userId) void SecureStore.getItemAsync(`kairos.leaderboard.prompt.${userId}`).then((seen) => {
      if (seen !== 'done') setPromptVisible(true);
    }).catch(() => setPromptVisible(true));
  }, [load, userId]));

  useEffect(() => { setDisplayName(progression?.displayName ?? ''); }, [progression?.displayName]);

  const privacyChoice = async (visible: boolean) => {
    if (!userId) return;
    setBusy(true); setPrivacyError(false);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in required');
      await updateProgression({ token, leaderboardVisible: visible, ...(visible && displayName.trim() ? { displayName: displayName.trim() } : {}) });
      await SecureStore.setItemAsync(`kairos.leaderboard.prompt.${userId}`, 'done');
      setPromptVisible(false);
      await load();
    } catch { setPrivacyError(true); } finally { setBusy(false); }
  };

  const update = async (patch: ProgressionPatch) => {
    const token = await getToken(); if (!token) return;
    try { await updateProgression({ token, ...patch }); await refresh(); await load(); }
    catch { Alert.alert('Could not update progress', 'Please try again.'); }
  };

  const buyFreeze = () => Alert.alert('Buy a streak freeze?', `This uses ${progression?.freezeCost ?? 25} keeps.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Buy', onPress: async () => { const token = await getToken(); if (!token) return; try { await buyStreakFreeze(token); await refresh(); } catch { Alert.alert('Not enough keeps', 'Earn more keeps before buying a freeze.'); } } },
  ]);

  if (loading && !progression) return <LoadingSkeleton rows={6} />;
  if (error && !progression) return <ErrorState title="Progress unavailable" onRetry={() => void load()} />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {progression ? (
          <>
            {/* XP Progress Card */}
            <SurfaceCard style={styles.card}>
              <View style={styles.levelRow}>
                <View style={[styles.levelBadge, { backgroundColor: colors.primaryContainer }]}>
                  <ThemedText colorKey="primary" style={styles.levelText}>
                    Level {progression.level}
                  </ThemedText>
                </View>
                <ThemedText colorKey="textMuted" style={styles.streakText}>
                  🔥 {progression.currentStreak} day streak
                </ThemedText>
              </View>

              <ThemedText colorKey="text" style={styles.xp}>
                {progression.xp.toLocaleString()} <ThemedText colorKey="textMuted" style={styles.xpUnit}>XP</ThemedText>
              </ThemedText>

              <View style={[styles.track, { backgroundColor: colors.primaryContainer }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.max(2, Math.min(100, progression.progress * 100))}%`,
                    },
                  ]}
                />
              </View>
              <ThemedText colorKey="textMuted" style={styles.xpLabel}>
                {progression.intoLevel.toLocaleString()} / {(progression.nextLevelXp - (progression.xp - progression.intoLevel)).toLocaleString()} XP to next level
              </ThemedText>

              <View style={styles.statsRow}>
                <View style={[styles.statChip, { backgroundColor: colors.primaryContainer }]}>
                  <Feather name="star" size={14} color={colors.primary} />
                  <ThemedText colorKey="text" style={styles.chipText}>{progression.keeps} keeps</ThemedText>
                </View>
                <View style={[styles.statChip, { backgroundColor: colors.successSurface }]}>
                  <Feather name="shield" size={14} color={colors.success} />
                  <ThemedText colorKey="text" style={styles.chipText}>{progression.freezeTokens} freezes</ThemedText>
                </View>
                <View style={[styles.statChip, { backgroundColor: '#FEF3C7' }]}>
                  <Feather name="award" size={14} color="#D97706" />
                  <ThemedText colorKey="text" style={styles.chipText}>{progression.longestStreak} best</ThemedText>
                </View>
              </View>

              <Pressable
                onPress={buyFreeze}
                disabled={progression.keeps < progression.freezeCost}
                accessibilityRole="button"
                accessibilityLabel={
                  progression.keeps < progression.freezeCost
                    ? `Buy freeze, need ${progression.freezeCost} keeps`
                    : `Buy streak freeze for ${progression.freezeCost} keeps`
                }
                style={[
                  styles.freezeButton,
                  { backgroundColor: colors.primaryContainer, opacity: progression.keeps < progression.freezeCost ? 0.5 : 1 },
                ]}
              >
                <Feather name="zap" size={15} color={colors.primary} />
                <ThemedText colorKey="primary" style={styles.freezeText}>
                  Buy streak freeze · {progression.freezeCost} keeps
                </ThemedText>
              </Pressable>
              {progression.keeps < progression.freezeCost ? (
                <ThemedText colorKey="textMuted" style={styles.freezeHint}>
                  You need {progression.freezeCost - progression.keeps} more keeps.
                </ThemedText>
              ) : null}
            </SurfaceCard>

            {/* Titles & Auras */}
            <View style={styles.heading}>
              <ThemedText colorKey="text" style={styles.sectionTitle}>Titles &amp; Auras</ThemedText>
            </View>
            {COSMETICS.filter((item) => item.kind !== 'freeze').map((item) => {
              const unlocked = progression.unlocks.find((unlock) => unlock.key === item.key)?.available ?? false;
              const equipped = item.kind === 'title' ? progression.equippedTitle === item.key : progression.equippedAura === item.key;
              return (
                <SurfaceCard key={item.key} style={styles.cosmeticCard}>
                  <View style={styles.cosmeticInner}>
                    <View style={[styles.cosmeticIcon, { backgroundColor: unlocked ? colors.primaryContainer : colors.surfaceContainerHigh }]}>
                      <Feather name={item.kind === 'title' ? 'tag' : 'sun'} size={18} color={unlocked ? colors.primary : colors.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText colorKey="text" style={styles.cosmeticLabel}>{item.label} {item.kind}</ThemedText>
                      <ThemedText colorKey="textMuted" style={styles.cosmeticSub}>
                        {unlocked ? 'Unlocked ✓' : `Unlock at ${item.streak} day streak`}
                      </ThemedText>
                    </View>
                    <Pressable
                      disabled={!unlocked || equipped}
                      onPress={() => void update(item.kind === 'title' ? { equippedTitle: item.key } : { equippedAura: item.key })}
                      accessibilityRole="button"
                      accessibilityLabel={`${equipped ? 'Equipped' : unlocked ? `Equip ${item.label} ${item.kind}` : `Locked, requires ${item.streak} day streak`}`}
                      style={[
                        styles.equipButton,
                        {
                          backgroundColor: equipped ? colors.primary : colors.primaryContainer,
                          opacity: unlocked && !equipped ? 1 : 0.55,
                        },
                      ]}
                    >
                      <ThemedText colorKey="onPrimary" style={[styles.equipText, { color: equipped ? colors.onPrimary : colors.primary }]}>
                        {equipped ? 'Equipped' : unlocked ? 'Equip' : 'Locked'}
                      </ThemedText>
                    </Pressable>
                  </View>
                </SurfaceCard>
              );
            })}

            {/* Leaderboards */}
            <View style={styles.heading}>
              <ThemedText colorKey="text" style={styles.sectionTitle}>Leaderboards</ThemedText>
            </View>

            <SurfaceCard style={styles.privacyCard}>
              <View style={styles.privacyRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText colorKey="text" style={styles.cosmeticLabel}>Show me on leaderboards</ThemedText>
                  <ThemedText colorKey="textMuted" style={styles.cosmeticSub}>
                    Your name, level, XP, and streak are visible to other participants.
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => void update({ leaderboardVisible: !progression.leaderboardVisible, ...(progression.displayName ? { displayName: progression.displayName } : {}) })}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: progression.leaderboardVisible }}
                  accessibilityLabel="Show me on leaderboards"
                >
                  <MaterialIcons
                    name={progression.leaderboardVisible ? 'toggle-on' : 'toggle-off'}
                    size={40}
                    color={progression.leaderboardVisible ? colors.primary : colors.textMuted}
                  />
                </Pressable>
              </View>
            </SurfaceCard>

            <View style={styles.nameRow}>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Leaderboard display name"
                placeholderTextColor={colors.inputPlaceholder}
                accessibilityLabel="Leaderboard display name"
                style={[styles.nameInput, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.inputFill }]}
              />
              <Pressable
                onPress={() => void update({ displayName: displayName.trim() })}
                accessibilityRole="button"
                accessibilityLabel="Save leaderboard display name"
                style={[styles.saveButton, { backgroundColor: colors.primaryContainer }]}
              >
                <ThemedText colorKey="primary" style={styles.saveText}>Save</ThemedText>
              </Pressable>
            </View>

            <View style={styles.scopes}>
              <View style={[styles.scopeActive, { backgroundColor: colors.primary }]}>
                <ThemedText colorKey="onPrimary" style={styles.scopeText}>Global</ThemedText>
              </View>
            </View>

            {leaderboard ? leaderboard.rows.map((row) => (
              <SurfaceCard key={row.userId} style={[styles.rankCard, row.self ? { borderColor: colors.borderActive, borderWidth: 1.5 } : {}]}>
                <View style={styles.rankRow}>
                  <View style={[styles.rankBadge, { backgroundColor: row.rank <= 3 ? '#FEF3C7' : colors.primaryContainer }]}>
                    <ThemedText colorKey="text" style={[styles.rankNum, { color: row.rank <= 3 ? '#D97706' : colors.primary }]}>
                      #{row.rank}
                    </ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText colorKey="text" style={styles.cosmeticLabel}>
                      {row.displayName}{row.self ? ' · You' : ''}
                    </ThemedText>
                    <ThemedText colorKey="textMuted" style={styles.cosmeticSub}>
                      Level {row.level} · {row.currentStreak} day streak{row.title ? ` · ${row.title}` : ''}
                    </ThemedText>
                  </View>
                  <ThemedText colorKey="primary" style={styles.rankXp}>{row.xp} XP</ThemedText>
                </View>
              </SurfaceCard>
            )) : <ErrorState title="Leaderboard unavailable" onRetry={() => void load()} />}
          </>
        ) : <ErrorState title="Progress unavailable" onRetry={() => void load()} />}
      </ScrollView>

      {/* Leaderboard privacy modal */}
      <Modal visible={promptVisible} transparent animationType="fade" onRequestClose={() => void privacyChoice(false)}>
        <View style={[styles.scrim, { backgroundColor: colors.scrim }]}>
          <View style={[styles.prompt, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle, borderWidth: 1 }]}>
            <ThemedText colorKey="text" style={styles.promptTitle}>Choose your leaderboard privacy</ThemedText>
            <ThemedText colorKey="textSecondary" style={styles.promptBody}>
              Leaderboards are private until you opt in. Choose whether to show your display name, level, XP, and streak.
            </ThemedText>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display name (optional)"
              placeholderTextColor={colors.inputPlaceholder}
              accessibilityLabel="Leaderboard display name"
              style={[styles.nameInput, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.inputFill }]}
            />
            {privacyError ? <ThemedText colorKey="error">Could not save your choice. Try again.</ThemedText> : null}
            <ThemedButton
              label="Show me on leaderboards"
              variant="primary"
              size="lg"
              disabled={busy}
              onPress={() => void privacyChoice(true)}
            />
            <Pressable
              disabled={busy}
              onPress={() => void privacyChoice(false)}
              accessibilityRole="button"
              accessibilityLabel="Keep me private"
            >
              <ThemedText colorKey="textSecondary" style={styles.privateText}>Keep me private</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 10 },

  // XP card
  card: { padding: 18, gap: 12 },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  levelText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  streakText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  xp: { fontFamily: 'Inter_700Bold', fontSize: 36, letterSpacing: -0.5 },
  xpUnit: { fontFamily: 'Inter_400Regular', fontSize: 20 },
  track: { height: 10, borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8 },
  xpLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: -4 },
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  freezeButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  freezeText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  freezeHint: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: -4 },

  // Sections
  heading: { marginTop: 12, marginBottom: 2 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.2 },

  // Cosmetics
  cosmeticCard: { padding: 14 },
  cosmeticInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cosmeticIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  cosmeticLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  cosmeticSub: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 1 },
  equipButton: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  equipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  // Leaderboard
  privacyCard: { padding: 14 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameRow: { flexDirection: 'row', gap: 8 },
  nameInput: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 15 },
  saveButton: { minHeight: 46, borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  scopes: { flexDirection: 'row', gap: 8 },
  scopeActive: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  scopeText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  rankCard: { padding: 12 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  rankXp: { fontFamily: 'Inter_700Bold', fontSize: 14 },

  // Modal
  scrim: { flex: 1, justifyContent: 'center', padding: 24 },
  prompt: { padding: 22, borderRadius: 24, gap: 14 },
  promptTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  promptBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  privateText: { fontFamily: 'Inter_400Regular', textAlign: 'center', padding: 8 },
});
