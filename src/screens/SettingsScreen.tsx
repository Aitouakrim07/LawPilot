import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { ScreenView } from '../components/ScreenView';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { connectorCatalog } from '../features/connectors/connectorRegistry';
import { useLawPilot } from '../providers/LawPilotProvider';
import { theme } from '../theme';

export function SettingsScreen() {
  const { snapshot, loadDemoWorkspace } = useLawPilot();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  async function handleLoadDemoWorkspace(): Promise<void> {
    if (loadingDemo) {
      return;
    }

    setDemoError(null);
    setDemoMessage(null);

    try {
      setLoadingDemo(true);
      const result = await loadDemoWorkspace();

      if (result.insertedClients === 0 && result.insertedMatters === 0) {
        setDemoMessage('Demo workspace already exists. No duplicate data was added.');
        return;
      }

      setDemoMessage(
        `Loaded demo workspace: ${result.insertedClients} client${
          result.insertedClients === 1 ? '' : 's'
        } and ${result.insertedMatters} matter${
          result.insertedMatters === 1 ? '' : 's'
        } added.`
      );
    } catch (error) {
      setDemoError(
        error instanceof Error
          ? error.message
          : 'Could not load demo workspace.'
      );
    } finally {
      setLoadingDemo(false);
    }
  }

  return (
    <ScreenView
      title="Settings"
      subtitle="Profile, connectors, and local-first workspace controls."
    >
      <SectionCard
        title="Profile"
        subtitle="Current local user profile used across this device."
      >
        {snapshot.user ? (
          <View style={styles.itemBody}>
            <Text style={styles.itemTitle}>{snapshot.user.name}</Text>
            <Text style={styles.itemMeta}>Law firm: {snapshot.user.lawFirmName}</Text>
            <Text style={styles.itemMeta}>Locale: {snapshot.user.locale}</Text>
            <Text style={styles.itemMeta}>Timezone: {snapshot.user.timezone}</Text>
            <Text style={styles.itemMeta}>
              Practice areas: {snapshot.user.practiceAreas || 'Not set'}
            </Text>
            <Text style={styles.itemMeta}>
              Working hours: {snapshot.user.workStartTime} - {snapshot.user.workEndTime}
            </Text>
          </View>
        ) : (
          <Text style={styles.bodyText}>No profile has been created yet.</Text>
        )}
      </SectionCard>

      <SectionCard
        title="Demo Workspace"
        subtitle="Optional sample clients and matters for quick testing."
      >
        <ActionButton
          label={loadingDemo ? 'Loading demo workspace...' : 'Load demo workspace'}
          onPress={() => {
            void handleLoadDemoWorkspace();
          }}
          variant="secondary"
        />

        {demoMessage ? <Text style={styles.successText}>{demoMessage}</Text> : null}
        {demoError ? <Text style={styles.errorText}>{demoError}</Text> : null}
      </SectionCard>

      <SectionCard
        title="Data Policy"
        subtitle="Local-first by default."
      >
        <Text style={styles.bodyText}>
          LawPilot stores users, clients, matters, tasks, reminders, appointments,
          voice notes, memory events, and connected accounts in on-device SQLite.
          No backend is required for this MVP. Google Calendar and Notion remain
          placeholders and are not active integrations.
        </Text>
      </SectionCard>

      <SectionCard
        title="Integrations"
        subtitle="LocalConnector is fully implemented. External connectors are placeholders."
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
  successText: {
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 13,
    color: theme.colors.success,
  },
  errorText: {
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 13,
    color: theme.colors.danger,
  },
});
