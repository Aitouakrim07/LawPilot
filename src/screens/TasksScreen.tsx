import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { ScreenView } from '../components/ScreenView';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { useLawPilot } from '../providers/LawPilotProvider';
import { theme } from '../theme';
import { formatHumanDueLabel } from '../utils/date';

export function TasksScreen() {
  const { snapshot, markTaskDone } = useLawPilot();
  const pendingTasks = snapshot.tasks.filter((task) => task.status === 'pending');
  const completedTasks = snapshot.tasks.filter((task) => task.status === 'done').slice(0, 5);

  return (
    <ScreenView
      title="Tasks"
      subtitle="Follow-ups and general work items created by voice or local actions."
    >
      <SectionCard title="Pending Work" subtitle="Open tasks ordered by due date.">
        {pendingTasks.length === 0 ? (
          <Text style={styles.helperText}>No pending tasks yet.</Text>
        ) : (
          pendingTasks.map((task) => (
            <View key={task.id} style={styles.itemRow}>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{task.title}</Text>
                <Text style={styles.itemMeta}>
                  {formatHumanDueLabel(task.dueAt, task.allDay)}
                </Text>
                <View style={styles.pillRow}>
                  <StatusPill
                    label={task.category.replace('_', ' ')}
                    tone={task.category === 'follow_up' ? 'success' : 'default'}
                  />
                  <StatusPill label={task.priority} tone="warning" />
                </View>
              </View>
              <ActionButton
                label="Done"
                variant="secondary"
                onPress={() => {
                  void markTaskDone(task.id);
                }}
              />
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title="Recently Completed" subtitle="Closed work stays visible for context.">
        {completedTasks.length === 0 ? (
          <Text style={styles.helperText}>No completed tasks yet.</Text>
        ) : (
          completedTasks.map((task) => (
            <View key={task.id} style={styles.itemRow}>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{task.title}</Text>
                <Text style={styles.itemMeta}>
                  Completed {task.completedAt ? formatHumanDueLabel(task.completedAt) : 'recently'}
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
    gap: theme.spacing.md,
    justifyContent: 'space-between',
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
  pillRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
    paddingTop: 2,
  },
});
