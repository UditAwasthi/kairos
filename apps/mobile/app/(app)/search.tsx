import { Redirect, useLocalSearchParams } from 'expo-router';

export default function SearchRedirect() {
  const params = useLocalSearchParams();
  return <Redirect href={{ pathname: '/(app)/(tabs)/recall', params }} />;
}
