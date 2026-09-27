import { useLocalSearchParams } from 'expo-router';

import { CaptureComposer } from '../../components/capture/CaptureComposer';
import { SoftPage, SoftTitle } from '../../components/ui/SoftScreen';

export default function QuickCaptureScreen() {
  const params = useLocalSearchParams<{
    text?: string;
    url?: string;
    source?: string;
  }>();
  const source =
    params.source === 'WIDGET'
      ? 'WIDGET'
      : params.source === 'SHARE'
        ? 'SHARE'
        : 'QUICK_CAPTURE';

  return (
    <SoftPage>
      <SoftTitle>Capture</SoftTitle>
      <CaptureComposer
        initialText={typeof params.text === 'string' ? params.text : ''}
        initialUrl={typeof params.url === 'string' ? params.url : ''}
        source={source}
      />
    </SoftPage>
  );
}
