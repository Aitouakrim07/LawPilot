import { createContext, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type {
  AppSnapshot,
  AssistantExecutionResult,
  CreateUserProfileInput,
  LoadDemoWorkspaceResult,
  UpdateUserProfileInput,
} from '../types/models';
import { getDatabase } from '../data/database';
import {
  createUserProfile as createUserProfileInStore,
  getAppSnapshot,
  hasUserProfile as hasUserProfileInStore,
  loadDemoWorkspace as loadDemoWorkspaceInStore,
  markReminderDone as markReminderDoneInStore,
  markTaskDone as markTaskDoneInStore,
  updateUserProfile as updateUserProfileInStore,
} from '../data/repositories';
import { executeAssistantCommand } from '../features/assistant/assistantService';
import { connectorRegistry } from '../features/connectors/connectorRegistry';
import {
  cancelLocalNotification,
  initializeNotifications,
} from '../features/notifications/notificationService';

interface LawPilotContextValue {
  snapshot: AppSnapshot;
  loading: boolean;
  hasUserProfile: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createUserProfile: (input: CreateUserProfileInput) => Promise<void>;
  updateUserProfile: (input: UpdateUserProfileInput) => Promise<void>;
  loadDemoWorkspace: () => Promise<LoadDemoWorkspaceResult>;
  runAssistantCommand: (transcript: string) => Promise<AssistantExecutionResult>;
  markTaskDone: (id: string) => Promise<void>;
  markReminderDone: (id: string) => Promise<void>;
}

const emptySnapshot: AppSnapshot = {
  user: null,
  clients: [],
  matters: [],
  tasks: [],
  reminders: [],
  appointments: [],
  voiceNotes: [],
  memoryEvents: [],
  connectedAccounts: [],
};

const LawPilotContext = createContext<LawPilotContextValue | null>(null);

export function LawPilotProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [hasUserProfile, setHasUserProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        await getDatabase();
        const [profileExists, nextSnapshot] = await Promise.all([
          hasUserProfileInStore(),
          getAppSnapshot(),
        ]);

        let nextError: string | null = null;

        try {
          await initializeNotifications();
        } catch (notificationError) {
          nextError =
            notificationError instanceof Error
              ? notificationError.message
              : 'Notification initialization failed.';
        }

        if (!active) {
          return;
        }

        setSnapshot(nextSnapshot);
        setHasUserProfile(profileExists);
        setError(nextError);
      } catch (bootstrapError) {
        if (!active) {
          return;
        }

        const message =
          bootstrapError instanceof Error
            ? bootstrapError.message
            : 'Failed to bootstrap the local workspace.';
        setError(message);
        setHasUserProfile(false);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  async function refresh(): Promise<void> {
    const [profileExists, nextSnapshot] = await Promise.all([
      hasUserProfileInStore(),
      getAppSnapshot(),
    ]);

    setHasUserProfile(profileExists);
    setSnapshot(nextSnapshot);
    setError(null);
  }

  async function createUserProfile(input: CreateUserProfileInput): Promise<void> {
    await createUserProfileInStore(input);
    await refresh();
  }

  async function loadDemoWorkspace(): Promise<LoadDemoWorkspaceResult> {
    const result = await loadDemoWorkspaceInStore();
    await refresh();
    return result;
  }

  async function updateUserProfile(input: UpdateUserProfileInput): Promise<void> {
    await updateUserProfileInStore(input);
    await refresh();
  }

  async function runAssistantCommand(
    transcript: string
  ): Promise<AssistantExecutionResult> {
    const latestSnapshot = await getAppSnapshot();
    const result = await executeAssistantCommand({
      transcript,
      snapshot: latestSnapshot,
      connector: connectorRegistry.local,
    });
    await refresh();
    return result;
  }

  async function markTaskDone(id: string): Promise<void> {
    const task = snapshot.tasks.find((item) => item.id === id);

    if (task?.notificationId) {
      await cancelLocalNotification(task.notificationId);
    }

    await markTaskDoneInStore(id);
    await refresh();
  }

  async function markReminderDone(id: string): Promise<void> {
    const reminder = snapshot.reminders.find((item) => item.id === id);

    if (reminder?.notificationId) {
      await cancelLocalNotification(reminder.notificationId);
    }

    await markReminderDoneInStore(id);
    await refresh();
  }

  return (
    <LawPilotContext.Provider
      value={{
        snapshot,
        loading,
        hasUserProfile,
        error,
        refresh,
        createUserProfile,
        updateUserProfile,
        loadDemoWorkspace,
        runAssistantCommand,
        markTaskDone,
        markReminderDone,
      }}
    >
      {children}
    </LawPilotContext.Provider>
  );
}

export function useLawPilot(): LawPilotContextValue {
  const value = useContext(LawPilotContext);

  if (!value) {
    throw new Error('useLawPilot must be used within a LawPilotProvider.');
  }

  return value;
}
