import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme';

type Status = 'normal' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  label: string;
  status?: Status;
  style?: ViewStyle;
}

const statusColors: Record<Status, { bg: string; text: string }> = {
  normal: { bg: colors.primarySoft, text: colors.primary },
  warning: { bg: colors.warnSoft, text: colors.warn },
  danger: { bg: colors.dangerSoft, text: colors.danger },
  info: { bg: colors.lineSoft, text: colors.inkMid },
};

export default function Badge({ label, status = 'info', style }: BadgeProps) {
  const { bg, text } = statusColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
