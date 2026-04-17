import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenView } from '../components/ScreenView';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { useLawPilot } from '../providers/LawPilotProvider';
import { theme } from '../theme';
import {
  addSpeechRecognitionListener,
  getSpeechRecognitionAvailability,
  speakAssistantText,
  startSpeechRecognition,
  stopAssistantSpeech,
  stopSpeechRecognition,
} from '../features/assistant/speech';

const quickCommands = [
  'Remind me tomorrow at 10 to call Ahmed about the immigration documents.',
  'What reminder did I ask you to create about Ahmed?',
  'What do I have today?',
  'Add a follow-up for client Sarah next Friday.',
  'Create a consultation appointment tomorrow at 3 PM.',
  'Show pending follow-ups.',
];

export function VoiceAssistantScreen() {
  const { snapshot, runAssistantCommand } = useLawPilot();
  const [inputValue, setInputValue] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState(
    'Speak or type a command. Every command will be logged to local memory.'
  );
  const [recognizing, setRecognizing] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    reason?: string;
  }>({ available: false });
  const [submitting, setSubmitting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(-1);
  const runningRef = useRef(false);
  const executeCommandRef = useRef<(commandText: string) => Promise<void>>(async () => {});

  executeCommandRef.current = async (commandText: string) => {
    const trimmed = commandText.trim();

    if (!trimmed || runningRef.current) {
      return;
    }

    runningRef.current = true;
    setSubmitting(true);
    setLiveTranscript(trimmed);

    try {
      const result = await runAssistantCommand(trimmed);
      setAssistantReply(result.responseText);
      setInputValue('');
      speakAssistantText(result.responseText);
    } catch (error) {
      setAssistantReply(
        error instanceof Error ? error.message : 'The assistant could not process that command.'
      );
    } finally {
      runningRef.current = false;
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let active = true;

    void getSpeechRecognitionAvailability().then((nextAvailability) => {
      if (active) {
        setAvailability(nextAvailability);
      }
    });

    const subscriptions = [
      addSpeechRecognitionListener('start', () => setRecognizing(true)),
      addSpeechRecognitionListener('end', () => setRecognizing(false)),
      addSpeechRecognitionListener('result', (event) => {
        const transcript = event.results[0]?.transcript?.trim();

        if (!transcript) {
          return;
        }

        setLiveTranscript(transcript);
        setInputValue(transcript);

        if (event.isFinal) {
          void executeCommandRef.current(transcript);
        }
      }),
      addSpeechRecognitionListener('error', (event) => {
        setAssistantReply(event.message);
        setRecognizing(false);
      }),
      addSpeechRecognitionListener('volumechange', (event) => {
        setVolumeLevel(event.value);
      }),
    ];

    return () => {
      active = false;
      subscriptions.forEach((subscription) => subscription?.remove());
      stopSpeechRecognition();
      stopAssistantSpeech();
    };
  }, []);

  async function handleMicPress() {
    if (recognizing) {
      stopSpeechRecognition();
      return;
    }

    const nextAvailability = await startSpeechRecognition({
      contextualStrings: [
        ...snapshot.clients.map((client) => client.name),
        ...snapshot.matters.map((matter) => matter.title),
      ],
    });

    setAvailability(nextAvailability);

    if (!nextAvailability.available) {
      setAssistantReply(nextAvailability.reason ?? 'Speech recognition is unavailable.');
    }
  }

  return (
    <ScreenView
      title="Voice Assistant"
      subtitle="Rule-based intent detection, local memory recall, and device-native voice I/O."
    >
      <SectionCard
        title="Assistant Console"
        subtitle="Designed for fast command capture on Android."
        style={styles.heroCard}
      >
        <View style={styles.heroHeader}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroLabel}>Microphone state</Text>
            <Text style={styles.heroStatus}>
              {recognizing ? 'Listening for a command…' : 'Ready for dictation'}
            </Text>
            <Text style={styles.heroSubtext}>
              {availability.available
                ? 'Speech recognition is available on this device.'
                : availability.reason ?? 'Speech recognition is currently unavailable.'}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              void handleMicPress();
            }}
            style={({ pressed }) => [
              styles.micButton,
              recognizing && styles.micButtonActive,
              pressed && styles.micButtonPressed,
            ]}
          >
            <Ionicons
              name={recognizing ? 'stop-outline' : 'mic-outline'}
              size={32}
              color={theme.colors.white}
            />
          </Pressable>
        </View>

        <View style={styles.signalRow}>
          <StatusPill
            label={recognizing ? 'Live capture' : 'Idle'}
            tone={recognizing ? 'success' : 'default'}
          />
          <Text style={styles.signalText}>
            Input level: {volumeLevel >= 0 ? volumeLevel.toFixed(1) : 'n/a'}
          </Text>
        </View>
      </SectionCard>

      <SectionCard
        title="Command"
        subtitle="The text field is available even when native speech capture is not."
      >
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Type a natural command"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          multiline
        />

        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
            ]}
            onPress={() => {
              void executeCommandRef.current(inputValue);
            }}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Processing…' : 'Run command'}
            </Text>
          </Pressable>
        </View>
      </SectionCard>

      <SectionCard title="Transcript" subtitle="Latest recognized or submitted instruction.">
        <Text style={styles.transcriptText}>
          {liveTranscript || 'No transcript captured yet.'}
        </Text>
      </SectionCard>

      <SectionCard title="Assistant Reply" subtitle="Response generated from local rules and SQLite search.">
        <Text style={styles.replyText}>{assistantReply}</Text>
      </SectionCard>

      <SectionCard title="Quick Commands" subtitle="Tap an example to test the rule-based assistant.">
        <View style={styles.quickList}>
          {quickCommands.map((command) => (
            <Pressable
              key={command}
              onPress={() => {
                setInputValue(command);
              }}
              style={({ pressed }) => [
                styles.quickChip,
                pressed && styles.quickChipPressed,
              ]}
            >
              <Text style={styles.quickChipText}>{command}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        title="Recent Memory Events"
        subtitle="The latest command log entries from the local event store."
      >
        {snapshot.memoryEvents.length === 0 ? (
          <Text style={styles.emptyText}>No commands logged yet.</Text>
        ) : (
          snapshot.memoryEvents.slice(0, 4).map((event) => (
            <View key={event.id} style={styles.memoryRow}>
              <Text style={styles.memoryTranscript}>{event.originalTranscript}</Text>
              <Text style={styles.memoryMeta}>{event.detectedIntent}</Text>
            </View>
          ))
        )}
      </SectionCard>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  heroTextBlock: {
    flex: 1,
    gap: 4,
  },
  heroLabel: {
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  heroStatus: {
    fontFamily: theme.typography.headingBold,
    fontSize: 28,
    color: theme.colors.white,
  },
  heroSubtext: {
    fontFamily: theme.typography.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 19,
  },
  micButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  micButtonActive: {
    backgroundColor: theme.colors.danger,
  },
  micButtonPressed: {
    opacity: 0.92,
  },
  signalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  signalText: {
    fontFamily: theme.typography.body,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
  },
  input: {
    minHeight: 108,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontFamily: theme.typography.body,
    fontSize: 15,
    color: theme.colors.text,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  submitButton: {
    minHeight: 46,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonText: {
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 14,
    color: theme.colors.white,
  },
  transcriptText: {
    fontFamily: theme.typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
  replyText: {
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
  quickList: {
    gap: theme.spacing.sm,
  },
  quickChip: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  quickChipPressed: {
    opacity: 0.9,
  },
  quickChipText: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  memoryRow: {
    gap: 4,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  memoryTranscript: {
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 14,
    color: theme.colors.text,
  },
  memoryMeta: {
    fontFamily: theme.typography.body,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  emptyText: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
});
