import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { ScreenView } from '../components/ScreenView';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { useLawPilot } from '../providers/LawPilotProvider';
import { theme } from '../theme';
import { formatHumanDueLabel } from '../utils/date';

export function RemindersScreen() {
  const { snapshot, markReminderDone } = useLawPilot();
  const pendingReminders = snapshot.reminders.filter(
    (reminder) => reminder.status === 'pending'
  );
  const completedReminders = snapshot.reminders.filter(
    (reminder) => reminder.status === 'done'
  );

  return (
    <ScreenView
      title="Reminders"
      subtitle="Every reminder is stored locally and linked back to memory_events."
    >
      <SectionCard title="Pending Reminders" subtitle="Open reminder queue.">
        {pendingReminders.length === 0 ? (
          <Text style={styles.helperText}>No pending reminders yet.</Text>
        ) : (
          pendingReminders.map((reminder) => (
            <View key={reminder.id} style={styles.itemRow}>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{reminder.title}</Text>
                <Text style={styles.itemMeta}>
                  {formatHumanDueLabel(reminder.remindAt, reminder.allDay)}
                </Text>
              </View>
              <View style={styles.actionColumn}>
                <StatusPill label="Pending" tone="warning" />
                <ActionButton
                  label="Done"
                  variant="secondary"
                  onPress={() => {
                    void markReminderDone(reminder.id);
                  }}
                />
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title="Completed" subtitle="Closed reminders remain searchable.">
        {completedReminders.length === 0 ? (
          <Text style={styles.helperText}>No completed reminders yet.</Text>
        ) : (
          completedReminders.map((reminder) => (
            <View key={reminder.id} style={styles.itemRow}>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{reminder.title}</Text>
                <Text style={styles.itemMeta}>
                  {formatHumanDueLabel(reminder.remindAt, reminder.allDay)}
                </Text>
              </View>
              <StatusPill label="Done" tone="success" />
            </View>
          ))
        )}
      </SectionCard>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  helperText: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    alignItems: 'center',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  itemBody: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 15,
    color: theme.colors.text,
  },
  itemMeta: {
    fontFamily: theme.typography.body,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  actionColumn: {
    gap: 8,
    alignItems: 'flex-end',
  },
});
