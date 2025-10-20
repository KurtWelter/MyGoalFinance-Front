// components/ui/ProgressBar.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../constants/theme';

export default function ProgressBar({ value = 0 }: { value?: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.wrap}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 8,
    backgroundColor: '#1a2236',
    borderRadius: radius.xs,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.green,
  },
});
