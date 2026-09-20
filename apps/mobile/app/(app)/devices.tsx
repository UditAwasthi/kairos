import { EmptyState } from '../../components/ui/EmptyState';
import { SoftPage } from '../../components/ui/SoftScreen';

export default function DevicesScreen() {
  return (
    <SoftPage>
      <EmptyState title="This device only" />
    </SoftPage>
  );
}
