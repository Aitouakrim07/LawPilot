import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

interface SectionCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

export function SectionCard({
  children,
  title,
  subtitle,
  style,
}: SectionCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: theme.typography.heading,
    fontSize: 22,
    color: theme.colors.text,
  },
  subtitle: {
    fontFamily: theme.typography.body,
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
});
