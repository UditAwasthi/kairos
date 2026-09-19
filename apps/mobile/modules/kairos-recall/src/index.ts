import { NativeModulesProxy, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type RecallStatus = {
  state: string;
  permission: string;
  capturing: boolean;
  paused?: boolean;
  queuedCount: number;
  lastError: string | null;
  lastUploadAt: number | null;
  entitlementCached: boolean | null;
  platform?: string;
};

export type RecallConfig = {
  apiBaseUrl?: string;
  sampleIntervalMs?: number;
  maxOcrPerMinute?: number;
  denylistPackages?: string[];
  entitlementAllowed?: boolean;
};

export type ConsentResult = {
  granted: boolean;
  permission: string;
};

type KairosRecallNative = {
  prepare(): Promise<RecallStatus>;
  requestConsent(): Promise<ConsentResult>;
  start(): Promise<RecallStatus>;
  pause(): Promise<RecallStatus>;
  resume(): Promise<RecallStatus>;
  stop(): Promise<RecallStatus>;
  getStatus(): Promise<RecallStatus>;
  setAuthToken(token: string | null): Promise<void>;
  clearLocalData(): Promise<RecallStatus>;
  setConfig(config: RecallConfig): Promise<RecallStatus>;
};

const IDLE: RecallStatus = {
  state: 'unavailable',
  permission: 'unsupported',
  capturing: false,
  queuedCount: 0,
  lastError: Platform.OS === 'android' ? 'Native Recall module unavailable' : 'Android only',
  lastUploadAt: null,
  entitlementCached: null,
  platform: Platform.OS,
};

function getNative(): KairosRecallNative | null {
  if (Platform.OS !== 'android') return null;
  try {
    return requireNativeModule<KairosRecallNative>('KairosRecall');
  } catch {
    // Expo Go / missing native binary
    if (NativeModulesProxy?.KairosRecall) {
      return NativeModulesProxy.KairosRecall as KairosRecallNative;
    }
    return null;
  }
}

export const Recall = {
  isAvailable(): boolean {
    return Platform.OS === 'android' && getNative() != null;
  },

  async prepare(): Promise<RecallStatus> {
    const native = getNative();
    if (!native) return IDLE;
    return native.prepare();
  },

  async requestConsent(): Promise<ConsentResult> {
    const native = getNative();
    if (!native) return { granted: false, permission: 'unsupported' };
    return native.requestConsent();
  },

  async start(): Promise<RecallStatus> {
    const native = getNative();
    if (!native) return IDLE;
    return native.start();
  },

  async pause(): Promise<RecallStatus> {
    const native = getNative();
    if (!native) return IDLE;
    return native.pause();
  },

  async resume(): Promise<RecallStatus> {
    const native = getNative();
    if (!native) return IDLE;
    return native.resume();
  },

  async stop(): Promise<RecallStatus> {
    const native = getNative();
    if (!native) return IDLE;
    return native.stop();
  },

  async getStatus(): Promise<RecallStatus> {
    const native = getNative();
    if (!native) return IDLE;
    return native.getStatus();
  },

  async setAuthToken(token: string | null): Promise<void> {
    const native = getNative();
    if (!native) return;
    await native.setAuthToken(token);
  },

  async clearLocalData(): Promise<RecallStatus> {
    const native = getNative();
    if (!native) return IDLE;
    return native.clearLocalData();
  },

  async setConfig(config: RecallConfig): Promise<RecallStatus> {
    const native = getNative();
    if (!native) return IDLE;
    return native.setConfig(config);
  },
};

export default Recall;
