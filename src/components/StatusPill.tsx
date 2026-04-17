import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

interface StatusPillProps {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

export function StatusPill({
  label,
  tone = 'default',
}: StatusPillProps) {
  return (
    <View
      style={[
        styles.base,
        tone === 'default' && styles.defaultTone,
        tone === 'success' && styles.successTone,
        tone === 'warning' && styles.warningTone,
        tone === 'danger' && styles.dangerTone,
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === 'default' && styles.defaultText,
          tone === 'success' && styles.successText,
          tone === 'warning' && styles.warningText,
          tone === 'danger' && styles.dangerText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  defaultTone: {
    backgroundColor: theme.colors.primarySoft,
  },
  successTone: {
    backgroundColor: theme.colors.successSoft,
  },
  warningTone: {
    backgroundColor: theme.colors.warningSoft,
  },
  dangerTone: {
    backgroundColor: theme.colors.dangerSoft,
  },
  label: {
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 12,
  },
  defaultText: {
    color: theme.colors.primary,
  },
  successText: {
    color: theme.colors.success,
  },
  warningText: {
    color: theme.colors.warning,
  },
  dangerText: {
    color: theme.colors.danger,
  },
});
