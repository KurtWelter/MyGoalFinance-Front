// components/ui/Button.tsx
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'ghost' | 'link';
};

export default function Button({
  children,
  onPress,
  loading,
  disabled,
  style,
  variant = 'primary',
}: Props) {
  const isDisabled = disabled || loading;

  if (variant === 'link') {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={[styles.link, style]}>
        <Text style={styles.linkText}>{children as any}</Text>
      </Pressable>
    );
  }

  const base = variant === 'primary' ? styles.primary : styles.ghost;
  const txt  = variant === 'primary' ? styles.primaryText : styles.ghostText;

  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[base, isDisabled && { opacity: .7 }, style]}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.accentDark : colors.muted} /> : <Text style={txt}>{children as any}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  primaryText: { color: colors.accentDark, fontWeight: '800' as const },
  ghost: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  ghostText: { color: '#cbd5e1', fontWeight: '700' as const },
  link: { padding: spacing.xs },
  linkText: { color: colors.accent, fontWeight: '700' as const },
});
