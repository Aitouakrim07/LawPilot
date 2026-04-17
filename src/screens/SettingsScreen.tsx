import { StyleSheet, Text, View } from 'react-native';
import { ScreenView } from '../components/ScreenView';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { connectorCatalog } from '../features/connectors/connectorRegistry';
import { useLawPilot } from '../providers/LawPilotProvider';
import { theme } from '../theme';

export function SettingsScreen() {
  const { snapshot } = useLawPilot();

  return (
    <ScreenView
      title="Settings"
      subtitle="Local integrations, connector architecture, and Android runtime notes."
    >
      <SectionCard
        title="Integrations"
        subtitle="LocalConnector is fully implemented. External connectors are intentionally placeholders for v1."
      >
        {connectorCatalog.map((descriptor) => {
          const account = snapshot.connectedAccounts.find(
            (item) => item.provider === descriptor.provider
          );

          return (
            <View key={descriptor.provider} style={styles.itemRow}>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{descriptor.label}</Text>
                <Text style={styles.itemMeta}>{descriptor.description}</Text>
                <Text style={styles.itemHint}>
                  Account label: {account?.displayName ?? 'Not configured'}
                </Text>
              </View>
              <StatusPill
                label={account?.status ?? 'disconnected'}
                tone={account?.status === 'connected' ? 'success' : 'warning'}
              />
            </View>
          );
        })}
      </SectionCard>

      <SectionCard
        title="Voice Runtime"
        subtitle="Speech-to-text stays local to the device speech service. Text-to-speech uses expo-speech."
      >
        <Text style={styles.bodyText}>
          Android live speech capture requires a development build because
          `expo-speech-recognition` needs a native config plugin. The text command
          box remains available for testing in Expo Go.
        </Text>
      </SectionCard>

      <SectionCard
        title="Data Policy"
        subtitle="No backend is used in v1 unless you add one later."
      >
        <Text style={styles.bodyText}>
          Users, clients, matters, tasks, reminders, appointments, voice notes,
          memory events, and connected accounts are stored in on-device SQLite.
          Every assistant command is written to `memory_events` with transcript,
          intent, extracted entities, and created record linkage.
        </Text>
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
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 15,
    color: theme.colors.text,
  },
  itemMeta: {
    fontFamily: theme.typography.body,
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  itemHint: {
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 12,
    color: theme.colors.primary,
  },
  bodyText: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text,
  },
});
