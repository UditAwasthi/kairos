import { useAuth } from '@clerk/expo';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../../components/ThemedText';
import { GlassPanel } from '../../components/ui/Glass';
import { SoftPage } from '../../components/ui/SoftScreen';
import { registerPushForSignedInUser } from '../../lib/notifications';
import { unregisterDevicePushToken } from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';

export default function DevicesScreen() {
  const { getToken } = useAuth();
  const { colors } = useAppTheme();
  const [permission, setPermission] = useState('Checking');
  const [registered, setRegistered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [status, token, enabled] = await Promise.all([
        Notifications.getPermissionsAsync(),
        SecureStore.getItemAsync('kairos.device.expoPushToken'),
        SecureStore.getItemAsync('kairos.device.pushEnabled'),
      ]);
      setPermission(status.granted ? 'Allowed' : status.status === 'denied' ? 'Denied' : 'Not requested');
      setRegistered(Boolean(token) && enabled !== 'false');
    } catch { setPermission('Unavailable'); setRegistered(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const toggle = async () => {
    setBusy(true); setMessage(null);
    try {
      if (registered) {
        const token = await SecureStore.getItemAsync('kairos.device.expoPushToken');
        const auth = await getToken();
        if (token && auth) await unregisterDevicePushToken({ token: auth, expoPushToken: token });
        await SecureStore.setItemAsync('kairos.device.pushEnabled', 'false');
        setRegistered(false);
      } else {
        const pushToken = await registerPushForSignedInUser(getToken);
        if (!pushToken) { setMessage('Notifications could not be enabled on this device. Check permission and try again.'); }
        else { setRegistered(true); }
      }
      await refresh();
    } catch { setMessage('Could not update this device. Please try again.'); }
    finally { setBusy(false); }
  };

  return <SoftPage>
    <ThemedText colorKey="textMuted" style={styles.lead}>Choose whether this phone can receive Kairos notifications when a capture uploads or a memory is ready.</ThemedText>
    <GlassPanel style={styles.panel}>
      <View style={styles.line}><ThemedText colorKey="text">Notification permission</ThemedText><ThemedText colorKey="textSecondary">{permission}</ThemedText></View>
      <View style={styles.line}><ThemedText colorKey="text">Push token registered</ThemedText><ThemedText colorKey="textSecondary">{registered ? 'Yes' : 'No'}</ThemedText></View>
      <View style={styles.line}><ThemedText colorKey="text">This device</ThemedText><ThemedText colorKey="textSecondary">{Platform.OS === 'ios' ? 'iPhone or iPad' : 'Android'}</ThemedText></View>
      <Pressable disabled={busy} onPress={() => void toggle()} accessibilityRole="switch" accessibilityState={{ checked: registered, disabled: busy }} accessibilityLabel={`${registered ? 'Disable' : 'Enable'} notifications for this device`} style={[styles.button, { backgroundColor: colors.text, opacity: busy ? 0.6 : 1 }]}>
        {busy ? <ActivityIndicator color={colors.background} /> : <ThemedText colorKey="background">{registered ? 'Disable notifications' : 'Enable notifications'}</ThemedText>}
      </Pressable>
      {message ? <ThemedText colorKey="textSecondary" accessibilityRole="alert">{message}</ThemedText> : null}
    </GlassPanel>
  </SoftPage>;
}

const styles = StyleSheet.create({ lead: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 8 }, panel: { gap: 15, padding: 16 }, line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, button: { minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginTop: 6 }, });
