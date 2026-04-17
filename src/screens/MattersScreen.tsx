import { StyleSheet, Text, View } from 'react-native';
import { ScreenView } from '../components/ScreenView';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { useLawPilot } from '../providers/LawPilotProvider';
import { theme } from '../theme';

export function MattersScreen() {
  const { snapshot } = useLawPilot();

  return (
    <ScreenView
      title="Matters"
      subtitle="Case and matter context is kept local and available to the assistant."
    >
      <SectionCard
        title="Open Matters"
        subtitle="Matter status is visible so voice-created tasks and reminders can attach later."
      >
        {snapshot.matters.map((matter) => {
          const client = snapshot.clients.find((item) => item.id === matter.clientId);

          return (
            <View key={matter.id} style={styles.itemRow}>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{matter.title}</Text>
                <Text style={styles.itemMeta}>
                  {client?.name ?? 'Unknown client'} • {matter.matterType}
                </Text>
                {matter.notes ? <Text style={styles.itemNotes}>{matter.notes}</Text> : null}
              </View>
              <StatusPill
                label={matter.status.replace('_', ' ')}
                tone={matter.status === 'active' ? 'success' : 'warning'}
              />
            </View>
          );
        })}
      </SectionCard>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  itemBody: {
    gap: 4,
  },
  itemTitle: {
    fontFamily: theme.typography.heading,
    fontSize: 22,
    color: theme.colors.text,
  },
  itemMeta: {
    fontFamily: theme.typography.body,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  itemNotes: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
});
