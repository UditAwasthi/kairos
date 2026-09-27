import { SoftPage, SoftTitle } from '../../../components/ui/SoftScreen';
import { CaptureComposer } from '../../../components/capture/CaptureComposer';

export default function CaptureScreen() {
  return (
    <SoftPage tabBar safeTop>
      <SoftTitle>Capture</SoftTitle>
      <CaptureComposer />
    </SoftPage>
  );
}
