// components/ui/Card.tsx
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../../constants/theme';

type Props = {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function Card({ title, right, children, style }: Props) {
  return (
    <View style={[styles.card, shadow.card, style]}>
      {(title || right) && (
        <View style={styles.top}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderColor: colors.border,
    borderWidth: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
