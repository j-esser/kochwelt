import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReminderFrequency = 'never' | 'daily' | 'weekly';

export interface AppSettings {
  reminderFrequency: ReminderFrequency;
  reminderWeekday: number;  // 0=Sonntag … 6=Samstag (JS-Standard)
  reminderHour: number;
  reminderMinute: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  reminderFrequency: 'never',
  reminderWeekday: 1,   // Montag
  reminderHour: 8,
  reminderMinute: 0,
};

export const WEEKDAY_LABELS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

const KEY = 'kochwelt_settings';
const NOTIFICATION_ID_KEY = 'kochwelt_notification_id';

// ─── Persistence ──────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function cancelExistingReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
  }
}

export async function scheduleReminder(settings: AppSettings): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelExistingReminder();
  if (settings.reminderFrequency === 'never') return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  let trigger: Notifications.NotificationTriggerInput;

  if (settings.reminderFrequency === 'daily') {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.reminderHour,
      minute: settings.reminderMinute,
    };
  } else {
    // weekly
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: settings.reminderWeekday === 0 ? 1 : settings.reminderWeekday + 1, // expo: 1=Sonntag
      hour: settings.reminderHour,
      minute: settings.reminderMinute,
    };
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🍳 Wochenplanung',
      body: 'Hast du deine Mahlzeiten für diese Woche schon geplant?',
      sound: true,
    },
    trigger,
  });

  await AsyncStorage.setItem(NOTIFICATION_ID_KEY, id);
}

export async function cancelReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelExistingReminder();
}
