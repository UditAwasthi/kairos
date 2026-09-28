import { useAuth } from '@clerk/expo';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { GlassPanel } from '../../components/ui/Glass';
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
  const { colors } = useAppTheme();
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

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <ScrollView contentContainerStyle={styles.content}>
      {progression ? <>
        <GlassPanel style={styles.card}>
          <ThemedText colorKey="textMuted" style={styles.kicker}>LEVEL {progression.level}</ThemedText>
          <ThemedText colorKey="text" style={styles.xp}>{progression.xp.toLocaleString()} XP</ThemedText>
          <View style={[styles.track, { backgroundColor: colors.border }]}><View style={[styles.fill, { backgroundColor: colors.text, width: `${Math.max(0, Math.min(100, progression.progress * 100))}%` }]} /></View>
          <ThemedText colorKey="textSecondary">{progression.intoLevel.toLocaleString()} / {(progression.nextLevelXp - (progression.xp - progression.intoLevel)).toLocaleString()} XP to next level</ThemedText>
          <View style={styles.statRow}><ThemedText colorKey="text">{progression.keeps} keeps</ThemedText><ThemedText colorKey="textSecondary">{progression.currentStreak} day streak · longest {progression.longestStreak}</ThemedText></View>
          <ThemedText colorKey="textSecondary">{progression.freezeTokens} freeze tokens</ThemedText>
          <Pressable onPress={buyFreeze} disabled={progression.keeps < progression.freezeCost} accessibilityRole="button" accessibilityLabel={progression.keeps < progression.freezeCost ? `Buy freeze, need ${progression.freezeCost} keeps` : `Buy streak freeze for ${progression.freezeCost} keeps`} style={[styles.button, { backgroundColor: colors.surfaceElevated, opacity: progression.keeps < progression.freezeCost ? 0.55 : 1 }]}><ThemedText colorKey="text">Buy a streak freeze · {progression.freezeCost} keeps</ThemedText></Pressable>
          {progression.keeps < progression.freezeCost ? <ThemedText colorKey="textMuted">You need {progression.freezeCost - progression.keeps} more keeps.</ThemedText> : null}
        </GlassPanel>

        <View style={styles.heading}><ThemedText colorKey="text" style={styles.title}>Titles & auras</ThemedText></View>
        {COSMETICS.filter((item) => item.kind !== 'freeze').map((item) => {
          const unlocked = progression.unlocks.find((unlock) => unlock.key === item.key)?.available ?? false;
          const equipped = item.kind === 'title' ? progression.equippedTitle === item.key : progression.equippedAura === item.key;
          return <GlassPanel key={item.key} style={styles.cosmetic}><View style={{ flex: 1 }}><ThemedText colorKey="text" style={styles.label}>{item.label} {item.kind}</ThemedText><ThemedText colorKey="textSecondary">{unlocked ? 'Unlocked' : `Unlock at a ${item.streak} day streak`}</ThemedText></View><Pressable disabled={!unlocked || equipped} onPress={() => void update(item.kind === 'title' ? { equippedTitle: item.key } : { equippedAura: item.key })} accessibilityRole="button" accessibilityLabel={`${equipped ? 'Equipped' : unlocked ? `Equip ${item.label} ${item.kind}` : `Locked, requires ${item.streak} day streak`}`} style={[styles.button, { backgroundColor: colors.surfaceElevated, opacity: unlocked && !equipped ? 1 : 0.6 }]}><ThemedText colorKey="text">{equipped ? 'Equipped' : unlocked ? 'Equip' : 'Locked'}</ThemedText></Pressable></GlassPanel>;
        })}

        <View style={styles.heading}><ThemedText colorKey="text" style={styles.title}>Leaderboards</ThemedText></View>
        <View style={[styles.privacy, { backgroundColor: colors.surfaceElevated }]}><View style={{ flex: 1 }}><ThemedText colorKey="text" style={styles.label}>Show me on leaderboards</ThemedText><ThemedText colorKey="textSecondary">Your name, level, XP, and streak are visible to other participants.</ThemedText></View><Pressable onPress={() => void update({ leaderboardVisible: !progression.leaderboardVisible, ...(progression.displayName ? { displayName: progression.displayName } : {}) })} accessibilityRole="switch" accessibilityState={{ checked: progression.leaderboardVisible }} accessibilityLabel="Show me on leaderboards"><MaterialIcons name={progression.leaderboardVisible ? 'toggle-on' : 'toggle-off'} size={36} color={colors.text} /></Pressable></View>
        <View style={{ flexDirection: 'row', gap: 8 }}><TextInput value={displayName} onChangeText={setDisplayName} placeholder="Leaderboard display name" placeholderTextColor={colors.textMuted} accessibilityLabel="Leaderboard display name" style={[styles.nameInput, { color: colors.text, borderColor: colors.border, flex: 1 }]} /><Pressable onPress={() => void update({ displayName: displayName.trim() })} accessibilityRole="button" accessibilityLabel="Save leaderboard display name" style={[styles.button, { backgroundColor: colors.surfaceElevated }]}><ThemedText colorKey="text">Save</ThemedText></Pressable></View>
        <View style={styles.scopes}><Pressable accessibilityRole="tab" accessibilityState={{ selected: true }} accessibilityLabel="Global leaderboard" style={[styles.scopeButton, { backgroundColor: colors.text }]}><ThemedText colorKey="background">Global</ThemedText></Pressable></View>
        {leaderboard ? leaderboard.rows.map((row) => <View key={row.userId} style={[styles.rank, { backgroundColor: colors.surfaceElevated }]}><ThemedText colorKey="text" style={styles.rankNum}>{row.rank}</ThemedText><View style={{ flex: 1 }}><ThemedText colorKey="text" style={styles.label}>{row.displayName}{row.self ? ' · You' : ''}</ThemedText><ThemedText colorKey="textSecondary">Level {row.level} · {row.currentStreak} day streak{row.title ? ` · ${row.title}` : ''}</ThemedText></View><ThemedText colorKey="text">{row.xp} XP</ThemedText></View>) : <ErrorState title="Leaderboard unavailable" onRetry={() => void load()} />}
      </> : <ErrorState title="Progress unavailable" onRetry={() => void load()} />}
    </ScrollView>

    <Modal visible={promptVisible} transparent animationType="fade" onRequestClose={() => void privacyChoice(false)}>
      <View style={[styles.scrim, { backgroundColor: colors.scrim }]}><View style={[styles.prompt, { backgroundColor: colors.surfaceElevated }]}><ThemedText colorKey="text" style={styles.title}>Choose your leaderboard privacy</ThemedText><ThemedText colorKey="textSecondary">Leaderboards are private until you opt in. Choose whether to show your display name, level, XP, and streak.</ThemedText><TextInput value={displayName} onChangeText={setDisplayName} placeholder="Display name (optional)" placeholderTextColor={colors.textMuted} accessibilityLabel="Leaderboard display name" style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]} />{privacyError ? <ThemedText colorKey="error">Could not save your choice. Try again.</ThemedText> : null}<Pressable disabled={busy} onPress={() => void privacyChoice(true)} accessibilityRole="button" accessibilityLabel="Show me on leaderboards" style={[styles.button, { backgroundColor: colors.text }]}><ThemedText colorKey="background">Show me on leaderboards</ThemedText></Pressable><Pressable disabled={busy} onPress={() => void privacyChoice(false)} accessibilityRole="button" accessibilityLabel="Keep me private"><ThemedText colorKey="textSecondary" style={styles.private}>Keep me private</ThemedText></Pressable></View></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: 16, paddingBottom: 32, gap: 10 }, card: { gap: 9, padding: 18 }, kicker: { fontFamily: 'Inter_500Medium', fontSize: 12, letterSpacing: 1 }, xp: { fontFamily: 'Inter_600SemiBold', fontSize: 32 }, track: { height: 9, borderRadius: 5, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 5 }, statRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }, button: { minHeight: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 }, heading: { marginTop: 12, marginBottom: 2 }, title: { fontFamily: 'Inter_600SemiBold', fontSize: 21 }, label: { fontFamily: 'Inter_500Medium', fontSize: 15 }, cosmetic: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 14 }, privacy: { borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }, scopes: { flexDirection: 'row', gap: 8 }, scopeButton: { flex: 1, padding: 10, borderRadius: 18, alignItems: 'center' }, rank: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 12 }, rankNum: { width: 28, textAlign: 'center', fontFamily: 'Inter_600SemiBold' }, empty: { padding: 16, textAlign: 'center' }, scrim: { flex: 1, justifyContent: 'center', padding: 22 }, prompt: { padding: 20, borderRadius: 22, gap: 14 }, nameInput: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 12 }, private: { textAlign: 'center', padding: 8 },
});
