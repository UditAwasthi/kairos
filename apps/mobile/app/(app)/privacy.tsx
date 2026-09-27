import { useRouter } from 'expo-router';

import { SoftLinkList, SoftPage, SoftRow } from '../../components/ui/SoftScreen';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SoftPage>
      <SoftRow icon="archive" label="Stores uploads & memory" />
      <SoftRow icon="cpu" label="Processes on Kairos" />
      <SoftRow icon="bell" label="Push alerts use this device token" />
      <SoftRow icon="eye" label="Recall stays on-device first" />

      <SoftLinkList
        items={[
          {
            label: 'Recall',
            icon: 'eye',
            onPress: () => router.push('/(app)/(tabs)/recall'),
          },
          {
            label: 'Data',
            icon: 'database',
            onPress: () => router.push('/(app)/data'),
          },
          {
            label: 'Devices',
            icon: 'smartphone',
            onPress: () => router.push('/(app)/devices'),
          },
        ]}
      />
    </SoftPage>
  );
}
