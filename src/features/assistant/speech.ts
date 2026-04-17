import * as Speech from 'expo-speech';
import type {
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';

type SpeechRecognitionPackage = typeof import('expo-speech-recognition');

export type SpeechRecognitionAvailability = {
  available: boolean;
  reason?: string;
};

export type SpeechListenerMap = {
  start: () => void;
  end: () => void;
  result: (event: ExpoSpeechRecognitionResultEvent) => void;
  error: (event: ExpoSpeechRecognitionErrorEvent) => void;
  volumechange: (event: { value: number }) => void;
};

export function speakAssistantText(text: string): void {
  Speech.stop();
  Speech.speak(text, {
    language: 'en-US',
    rate: 0.97,
    pitch: 1,
  });
}

export function stopAssistantSpeech(): void {
  Speech.stop();
}

export async function getSpeechRecognitionAvailability(): Promise<SpeechRecognitionAvailability> {
  const speechPackage = getSpeechRecognitionPackage();

  if (!speechPackage) {
    return {
      available: false,
      reason:
        'Android voice capture requires a development build with expo-speech-recognition configured.',
    };
  }

  try {
    const available = speechPackage.ExpoSpeechRecognitionModule.isRecognitionAvailable();
    return available
      ? { available: true }
      : {
          available: false,
          reason: 'This device does not expose an Android speech recognition service.',
        };
  } catch {
    return {
      available: false,
      reason:
        'Android voice capture requires a development build with expo-speech-recognition configured.',
    };
  }
}

export async function startSpeechRecognition(input?: {
  contextualStrings?: string[];
}): Promise<SpeechRecognitionAvailability> {
  const speechPackage = getSpeechRecognitionPackage();

  if (!speechPackage) {
    return {
      available: false,
      reason:
        'Android voice capture requires a development build with expo-speech-recognition configured.',
    };
  }

  try {
    const permission =
      await speechPackage.ExpoSpeechRecognitionModule.requestPermissionsAsync();

    if (!permission.granted) {
      return {
        available: false,
        reason: 'Microphone permission was not granted.',
      };
    }

    speechPackage.ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
      addsPunctuation: true,
      contextualStrings: input?.contextualStrings?.slice(0, 25),
    });

    return { available: true };
  } catch {
    return {
      available: false,
      reason:
        'Speech recognition could not start. Use the text command box or run the app in a development build.',
    };
  }
}

export function stopSpeechRecognition(): void {
  const speechPackage = getSpeechRecognitionPackage();

  try {
    speechPackage?.ExpoSpeechRecognitionModule.stop();
  } catch {
    // Ignore.
  }
}

export function addSpeechRecognitionListener<K extends keyof SpeechListenerMap>(
  eventName: K,
  listener: SpeechListenerMap[K]
): { remove: () => void } | null {
  const speechPackage = getSpeechRecognitionPackage();

  if (!speechPackage) {
    return null;
  }

  try {
    return speechPackage.ExpoSpeechRecognitionModule.addListener(
      eventName,
      listener as never
    );
  } catch {
    return null;
  }
}

function getSpeechRecognitionPackage(): SpeechRecognitionPackage | null {
  try {
    return require('expo-speech-recognition') as SpeechRecognitionPackage;
  } catch {
    return null;
  }
}
