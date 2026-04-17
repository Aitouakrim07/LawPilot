import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { ScreenView } from '../components/ScreenView';
import { SectionCard } from '../components/SectionCard';
import { useLawPilot } from '../providers/LawPilotProvider';
import { theme } from '../theme';

function getDefaultTimezone(): string {
  try {
    const value = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof value === 'string' && value.trim() ? value : 'UTC';
  } catch {
    return 'UTC';
  }
}

export function OnboardingScreen() {
  const { createUserProfile } = useLawPilot();
  const [fullName, setFullName] = useState('');
  const [lawFirmName, setLawFirmName] = useState('');
  const [locale, setLocale] = useState('en-US');
  const [timezone, setTimezone] = useState(getDefaultTimezone);
  const [practiceAreas, setPracticeAreas] = useState('');
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(): Promise<void> {
    if (submitting) {
      return;
    }

    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!lawFirmName.trim()) {
      setError('Please enter your law firm name.');
      return;
    }

    try {
      setSubmitting(true);
      await createUserProfile({
        name: fullName,
        lawFirmName,
        locale,
        timezone,
        practiceAreas,
        workStartTime,
        workEndTime,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not create your local profile.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenView
      title="Welcome to LawPilot"
      subtitle="Create your local profile to start with a clean workspace."
    >
      <SectionCard
        title="Workspace Profile"
        subtitle="You can edit these values later from Settings."
      >
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
            returnKeyType="next"
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
            returnKeyType="next"
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
            returnKeyType="next"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Timezone</Text>
          <TextInput
            value={timezone}
            onChangeText={setTimezone}
            placeholder="Europe/Paris"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Main practice areas</Text>
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ActionButton
          label={submitting ? 'Creating local workspace...' : 'Create local workspace'}
          onPress={() => {
            void handleSubmit();
          }}
        />

        {submitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.helperText}>Saving profile to on-device SQLite...</Text>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard title="Local-first" subtitle="Your data stays on this device.">
        <Text style={styles.helperText}>
          No backend or paid AI API is required. LawPilot stores users, clients, matters,
          tasks, reminders, appointments, voice notes, and memory events in local SQLite.
        </Text>
      </SectionCard>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
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
    minHeight: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontFamily: theme.typography.body,
    fontSize: 15,
    color: theme.colors.text,
  },
  multilineInput: {
    minHeight: 82,
    textAlignVertical: 'top',
  },
  errorText: {
    fontFamily: theme.typography.bodySemiBold,
    color: theme.colors.danger,
    fontSize: 13,
  },
  helperText: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
});
