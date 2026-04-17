import { StyleSheet, Text, View } from 'react-native';
import { ScreenView } from '../components/ScreenView';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { useLawPilot } from '../providers/LawPilotProvider';
import { theme } from '../theme';

export function ClientsScreen() {
  const { snapshot } = useLawPilot();

  return (
    <ScreenView
      title="Clients"
      subtitle="Contact context linked to matters, reminders, and follow-ups."
    >
      <SectionCard
        title="Client Roster"
        subtitle="The starter workspace includes Ahmed and Sarah from the sample use cases."
      >
        {snapshot.clients.map((client) => {
          const matterCount = snapshot.matters.filter(
            (matter) => matter.clientId === client.id
          ).length;
          const pendingTaskCount = snapshot.tasks.filter(
            (task) => task.clientId === client.id && task.status === 'pending'
          ).length;

          return (
            <View key={client.id} style={styles.itemRow}>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{client.name}</Text>
                <Text style={styles.itemMeta}>
                  {client.email ?? 'No email'} • {client.phone ?? 'No phone'}
                </Text>
                {client.notes ? <Text style={styles.itemNotes}>{client.notes}</Text> : null}
              </View>
              <View style={styles.pillColumn}>
                <StatusPill label={`${matterCount} matters`} />
                <StatusPill label={`${pendingTaskCount} pending`} tone="success" />
              </View>
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
    fontSize: 24,
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
  pillColumn: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
});
