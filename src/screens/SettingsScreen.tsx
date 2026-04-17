import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { ScreenView } from '../components/ScreenView';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { connectorCatalog } from '../features/connectors/connectorRegistry';
import { useLawPilot } from '../providers/LawPilotProvider';
import { theme } from '../theme';

export function SettingsScreen() {
  const { snapshot, loadDemoWorkspace, updateUserProfile } = useLawPilot();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [lawFirmName, setLawFirmName] = useState('');
  const [locale, setLocale] = useState('en-US');
  const [timezone, setTimezone] = useState('UTC');
  const [practiceAreas, setPracticeAreas] = useState('');
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');

  useEffect(() => {
    if (!snapshot.user) {
      return;
    }

    setFullName(snapshot.user.name);
    setLawFirmName(snapshot.user.lawFirmName);
    setLocale(snapshot.user.locale);
    setTimezone(snapshot.user.timezone);
    setPracticeAreas(snapshot.user.practiceAreas);
    setWorkStartTime(snapshot.user.workStartTime);
    setWorkEndTime(snapshot.user.workEndTime);
  }, [snapshot.user]);

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

  async function handleSaveProfile(): Promise<void> {
    if (!snapshot.user || savingProfile) {
      return;
    }

    setProfileError(null);
    setProfileMessage(null);

    if (!fullName.trim()) {
      setProfileError('Full name is required.');
      return;
    }

    if (!lawFirmName.trim()) {
      setProfileError('Law firm name is required.');
      return;
    }

    try {
      setSavingProfile(true);
      await updateUserProfile({
        name: fullName,
        lawFirmName,
        locale,
        timezone,
        practiceAreas,
        workStartTime,
        workEndTime,
      });
      setProfileMessage('Profile updated.');
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : 'Could not update profile.'
      );
    } finally {
      setSavingProfile(false);
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
            <Text style={styles.itemTitle}>Edit profile</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Law firm name</Text>
              <TextInput
                value={lawFirmName}
                onChangeText={setLawFirmName}
                placeholder="Law firm name"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Locale / language</Text>
              <TextInput
                value={locale}
                onChangeText={setLocale}
                placeholder="en-US"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Timezone</Text>
              <TextInput
                value={timezone}
                onChangeText={setTimezone}
                placeholder="UTC"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Practice areas</Text>
              <TextInput
                value={practiceAreas}
                onChangeText={setPracticeAreas}
                placeholder="Immigration, Employment"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, styles.multilineInput]}
                autoCapitalize="words"
                autoCorrect={false}
                multiline
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowField}>
                <Text style={styles.label}>Work start</Text>
                <TextInput
                  value={workStartTime}
                  onChangeText={setWorkStartTime}
                  placeholder="09:00"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.rowField}>
                <Text style={styles.label}>Work end</Text>
                <TextInput
                  value={workEndTime}
                  onChangeText={setWorkEndTime}
                  placeholder="18:00"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <ActionButton
              label={savingProfile ? 'Saving profile...' : 'Save profile'}
              onPress={() => {
                void handleSaveProfile();
              }}
              variant="secondary"
            />
            {profileMessage ? <Text style={styles.successText}>{profileMessage}</Text> : null}
            {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
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
  fieldGroup: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  rowField: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 13,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.typography.body,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
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
