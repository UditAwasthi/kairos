import { useRouter } from 'expo-router';
import { ScreenRecallCard } from '../../components/recall/ScreenRecallCard';
import { SoftLinkList, SoftPage, SoftRow, SoftTitle } from '../../components/ui/SoftScreen';
import { KairosText } from '../../components/ui/Kairos';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SoftPage>
      <SoftTitle>Privacy & Recall</SoftTitle>
      <KairosText variant="caption" color="textSecondary">
        What stays on this device, and what Kairos stores for you.
      </KairosText>
      <SoftRow icon="archive" label="Stores uploads & memory" />
      <SoftRow icon="cpu" label="Processes on Kairos" />
      <SoftRow icon="bell" label="Push alerts use this device token" />
      <ScreenRecallCard />
      <SoftLinkList
        items={[
          {
            label: 'Data',
            icon: 'database',
            onPress: () => router.push('/(app)/data'),
          },
        ]}
      />
    </SoftPage>
  );
}
