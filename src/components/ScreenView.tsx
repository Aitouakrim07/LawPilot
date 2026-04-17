import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

interface ScreenViewProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
}

export function ScreenView({
  children,
  title,
  subtitle,
  rightAction,
}: ScreenViewProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
    gap: theme.spacing.md,
  },
  header: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  headerTextBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: theme.typography.headingBold,
    fontSize: 32,
    lineHeight: 38,
    color: theme.colors.text,
  },
  subtitle: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  rightAction: {
    paddingTop: 8,
  },
});
