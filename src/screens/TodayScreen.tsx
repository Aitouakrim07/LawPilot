import { Ionicons } from '@expo/vector-icons';
import { addDays, format } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ActionButton } from '../components/ActionButton';
import { ScreenView } from '../components/ScreenView';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { useLawPilot } from '../providers/LawPilotProvider';
import { theme } from '../theme';
import {
  formatDateTimeLabel,
  formatHumanDueLabel,
  isSameCalendarDay,
} from '../utils/date';

export function TodayScreen() {
  const navigation = useNavigation<any>();
  const { snapshot, loading, error } = useLawPilot();
  const today = new Date();

  const todayAppointments = snapshot.appointments.filter(
    (appointment) =>
      appointment.status === 'scheduled' &&
      isSameCalendarDay(appointment.startsAt, today)
  );
  const todayReminders = snapshot.reminders.filter(
    (reminder) =>
      reminder.status === 'pending' && isSameCalendarDay(reminder.remindAt, today)
  );
  const todayTasks = snapshot.tasks.filter(
    (task) =>
      task.status === 'pending' && task.dueAt && isSameCalendarDay(task.dueAt, today)
  );
  const isWorkspaceEmpty =
    snapshot.clients.length === 0 &&
    snapshot.matters.length === 0 &&
    snapshot.tasks.length === 0 &&
    snapshot.reminders.length === 0;
  const upcomingReminders = snapshot.reminders
    .filter((reminder) => reminder.status === 'pending')
    .slice(0, 3);
  const recentMemory = snapshot.memoryEvents.slice(0, 3);
  const weekStrip = Array.from({ length: 7 }, (_, index) => addDays(today, index));

  function openScreen(route: 'Reminders' | 'Settings') {
    navigation.getParent()?.navigate(route);
  }

  return (
    <ScreenView
      title="Today"
      subtitle={`${format(today, 'EEEE, MMMM d')} • ${
        snapshot.user?.lawFirmName ?? 'Local workspace'
      }`}
      rightAction={
        <ActionButton
          label="Settings"
          variant="secondary"
          onPress={() => openScreen('Settings')}
        />
      }
    >
      <SectionCard
        title="Daily Control"
        subtitle="A compact agenda built for solo-practice follow-through."
        style={styles.heroCard}
      >
        <View style={styles.metricsRow}>
          <MetricTile label="Appointments" value={todayAppointments.length} />
          <MetricTile label="Reminders" value={todayReminders.length} />
          <MetricTile label="Tasks" value={todayTasks.length} />
        </View>

        <View style={styles.quickActions}>
          <ActionButton
            label="Voice Assistant"
            onPress={() => navigation.navigate('Voice')}
            icon={<Ionicons name="mic-outline" size={16} color={theme.colors.white} />}
          />
          <ActionButton
            label="Reminders"
            variant="secondary"
            onPress={() => openScreen('Reminders')}
            icon={
              <Ionicons
                name="notifications-outline"
                size={16}
                color={theme.colors.text}
              />
            }
          />
        </View>

        {isWorkspaceEmpty ? (
          <View style={styles.emptyWorkspaceBanner}>
            <Text style={styles.emptyWorkspaceText}>
              Start by adding a client, creating a matter, or using the voice assistant.
            </Text>
          </View>
        ) : null}

        <View style={styles.weekStrip}>
          {weekStrip.map((date) => {
            const isToday = isSameCalendarDay(date, today);
            return (
              <View
                key={date.toISOString()}
                style={[styles.weekDayCard, isToday && styles.weekDayCardActive]}
              >
                <Text
                  style={[
                    styles.weekDayLabel,
                    isToday && styles.weekDayLabelActive,
                  ]}
                >
                  {format(date, 'EEE')}
                </Text>
                <Text
                  style={[
                    styles.weekDayNumber,
                    isToday && styles.weekDayNumberActive,
                  ]}
                >
                  {format(date, 'd')}
                </Text>
              </View>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard
        title="Agenda"
        subtitle="Appointments, reminders, and due work scheduled for today."
      >
        {loading ? <Text style={styles.helperText}>Loading local agenda…</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {!loading &&
        todayAppointments.length === 0 &&
        todayReminders.length === 0 &&
        todayTasks.length === 0 ? (
          <Text style={styles.helperText}>No time-bound items are due today.</Text>
        ) : null}

        {todayAppointments.map((appointment) => (
          <View key={appointment.id} style={styles.itemRow}>
            <View style={styles.itemBody}>
              <Text style={styles.itemTitle}>{appointment.title}</Text>
              <Text style={styles.itemMeta}>
                {formatDateTimeLabel(appointment.startsAt)}
              </Text>
            </View>
            <StatusPill label="Appointment" />
          </View>
        ))}

        {todayReminders.map((reminder) => (
          <View key={reminder.id} style={styles.itemRow}>
            <View style={styles.itemBody}>
              <Text style={styles.itemTitle}>{reminder.title}</Text>
              <Text style={styles.itemMeta}>
                {formatHumanDueLabel(reminder.remindAt, reminder.allDay)}
              </Text>
            </View>
            <StatusPill label="Reminder" tone="warning" />
          </View>
        ))}

        {todayTasks.map((task) => (
          <View key={task.id} style={styles.itemRow}>
            <View style={styles.itemBody}>
              <Text style={styles.itemTitle}>{task.title}</Text>
              <Text style={styles.itemMeta}>
                {formatHumanDueLabel(task.dueAt, task.allDay)}
              </Text>
            </View>
            <StatusPill
              label={task.category === 'follow_up' ? 'Follow-up' : 'Task'}
              tone="success"
            />
          </View>
        ))}
      </SectionCard>

      <SectionCard
        title="Upcoming Reminders"
        subtitle="The next pending reminders saved in the local memory log."
      >
        {upcomingReminders.length === 0 ? (
          <Text style={styles.helperText}>No pending reminders yet.</Text>
        ) : (
          upcomingReminders.map((reminder) => (
            <View key={reminder.id} style={styles.itemRow}>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{reminder.title}</Text>
                <Text style={styles.itemMeta}>
                  {formatHumanDueLabel(reminder.remindAt, reminder.allDay)}
                </Text>
              </View>
              <StatusPill label={reminder.status} tone="warning" />
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Recent Memory"
        subtitle="Every command is logged to memory_events for traceable recall."
      >
        {recentMemory.length === 0 ? (
          <Text style={styles.helperText}>No voice commands have been logged yet.</Text>
        ) : (
          recentMemory.map((event) => (
            <View key={event.id} style={styles.memoryRow}>
              <Text style={styles.memoryTranscript}>{event.originalTranscript}</Text>
              <Text style={styles.memoryMeta}>
                {event.detectedIntent} • {formatDateTimeLabel(event.timestamp)}
              </Text>
            </View>
          ))
        )}
      </SectionCard>
    </ScreenView>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metricTile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 4,
  },
  metricValue: {
    fontFamily: theme.typography.headingBold,
    fontSize: 28,
    color: theme.colors.white,
  },
  metricLabel: {
    fontFamily: theme.typography.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  emptyWorkspaceBanner: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  emptyWorkspaceText: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.92)',
  },
  weekStrip: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  weekDayCard: {
    width: 44,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 2,
  },
  weekDayCardActive: {
    backgroundColor: theme.colors.accent,
  },
  weekDayLabel: {
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  weekDayLabelActive: {
    color: theme.colors.white,
  },
  weekDayNumber: {
    fontFamily: theme.typography.heading,
    fontSize: 18,
    color: theme.colors.white,
  },
  weekDayNumberActive: {
    color: theme.colors.white,
  },
  helperText: {
    fontFamily: theme.typography.body,
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    fontFamily: theme.typography.bodySemiBold,
    color: theme.colors.danger,
    fontSize: 13,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
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
    color: theme.colors.text,
    fontSize: 15,
  },
  itemMeta: {
    fontFamily: theme.typography.body,
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  memoryRow: {
    gap: 4,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  memoryTranscript: {
    fontFamily: theme.typography.bodySemiBold,
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  memoryMeta: {
    fontFamily: theme.typography.body,
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});
