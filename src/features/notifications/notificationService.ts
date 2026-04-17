import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const DEFAULT_CHANNEL_ID = 'lawpilot-default';

let configured = false;

export async function initializeNotifications(): Promise<void> {
  if (configured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
      name: 'LawPilot Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 160, 200],
      lightColor: '#B88746',
    });
  }

  if (Platform.OS !== 'web') {
    try {
      await Notifications.requestPermissionsAsync();
    } catch {
      // Scheduling is best-effort in v1.
    }
  }

  configured = true;
}

export async function scheduleLocalNotification(input: {
  title: string;
  body: string;
  triggerAt: string | Date | null;
}): Promise<string | null> {
  if (!input.triggerAt) {
    return null;
  }

  const triggerDate = input.triggerAt instanceof Date ? input.triggerAt : new Date(input.triggerAt);

  if (Number.isNaN(triggerDate.getTime()) || triggerDate <= new Date()) {
    return null;
  }

  try {
    await initializeNotifications();

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: DEFAULT_CHANNEL_ID,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelLocalNotification(
  notificationId: string | null | undefined
): Promise<void> {
  if (!notificationId) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore stale identifiers.
  }
}
