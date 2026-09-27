import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorState } from './EmptyState';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = { failed: boolean };

/** Keeps a screen visible if one widget throws. */
export class ScreenGuard extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('ScreenGuard', error.message, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return (
      <View style={styles.fill}>
        <ErrorState title="Unable to load" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
