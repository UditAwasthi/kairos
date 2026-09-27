import { Redirect, useLocalSearchParams } from 'expo-router';

export default function RelatedRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/(app)/observation/${String(id)}`} />;
}
