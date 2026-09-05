import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';

const COLS = 7;
const ROWS = 5;

/**
 * Static decorative grid — no Reanimated worklets.
 * (Previous animated version ran 77 continuous styles and caused auth/onboarding lag.)
 */
export function DotField() {
  const { colors } = useAppTheme();

  return (
    <View style={styles.grid} pointerEvents="none">
      {Array.from({ length: COLS * ROWS }, (_, index) => {
        const col = index % COLS;
        const row = Math.floor(index / COLS);
        const centerDist = Math.abs(col - 3) + Math.abs(row - 2);
        const opacity = Math.max(0.06, 0.22 - centerDist * 0.03);

        return (
          <View
            key={index}
            style={[styles.dot, { backgroundColor: colors.dot, opacity }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 120,
    gap: 10,
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 999,
  },
});
