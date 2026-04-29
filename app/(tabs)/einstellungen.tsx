import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Platform, Switch,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getSettings, saveSettings, scheduleReminder, cancelReminder,
  requestNotificationPermission, WEEKDAY_LABELS,
  type AppSettings, type ReminderFrequency,
} from '../../services/settingsStore';
import {
  getNutritionGoals, saveNutritionGoals, DEFAULT_GOALS,
  type NutritionGoals, type MealSplits,
} from '../../services/nutritionGoals';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, '0'); }

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
}

function Row({
  icon, label, children, last,
}: {
  icon: string; label: string; children: React.ReactNode; last?: boolean;
}) {
  return (
    <View style={[s.row, !last && s.rowBorder]}>
      <Ionicons name={icon as any} size={18} color="#f97316" style={s.rowIcon} />
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.rowRight}>{children}</View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EinstellungenScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [dirty, setDirty] = useState(false);
  const [goalsDirty, setGoalsDirty] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [s, g] = await Promise.all([getSettings(), getNutritionGoals()]);
      setSettings(s);
      setGoals(g);
      setDirty(false);
      setGoalsDirty(false);
    })();
  }, []));

  function updateSettings(patch: Partial<AppSettings>) {
    setSettings(prev => prev ? { ...prev, ...patch } : prev);
    setDirty(true);
  }

  function updateGoal(key: keyof Omit<NutritionGoals, 'splits'>, raw: string) {
    const n = parseInt(raw, 10);
    setGoals(prev => ({ ...prev, [key]: isNaN(n) ? 0 : n }));
    setGoalsDirty(true);
  }

  function updateSplit(key: keyof MealSplits, delta: number) {
    setGoals(prev => ({
      ...prev,
      splits: { ...prev.splits, [key]: Math.min(100, Math.max(0, (prev.splits[key] ?? 0) + delta)) },
    }));
    setGoalsDirty(true);
  }

  async function handleSaveAll() {
    if (!settings) return;
    if (dirty) {
      await saveSettings(settings);
      if (settings.reminderFrequency === 'never') {
        await cancelReminder();
      } else {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert('Keine Berechtigung', 'Bitte Benachrichtigungen in den Systemeinstellungen erlauben.');
          return;
        }
        await scheduleReminder(settings);
      }
    }
    if (goalsDirty) {
      await saveNutritionGoals(goals);
    }
    setDirty(false);
    setGoalsDirty(false);
    Alert.alert('Gespeichert', 'Einstellungen wurden gespeichert.');
  }

  const splitsTotal = goals.splits.frueh + goals.splits.mittag + goals.splits.abend + goals.splits.sonst;

  if (!settings) return null;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.navBar}>
        <Text style={s.navTitle}>Einstellungen</Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 80}
        extraHeight={140}
      >

        {/* ── Browser-Import ── */}
        <SectionHeader title="Rezept aus Browser importieren" />
        <View style={s.importCard}>
          {Platform.OS === 'ios' ? (
            <>
              <View style={s.importStep}>
                <Ionicons name="clipboard-outline" size={18} color="#f97316" style={{ marginTop: 1 }} />
                <Text style={s.stepText}>
                  Rezept-URL in Safari <Text style={s.bold}>kopieren</Text> → Kochwelt öffnen → <Text style={s.bold}>+ Neues Rezept</Text> — die App erkennt die URL automatisch und bietet den Import an.
                </Text>
              </View>
              <View style={[s.importStep, { borderTopWidth: 1, borderTopColor: '#fed7aa', paddingTop: 10 }]}>
                <Ionicons name="information-circle-outline" size={16} color="#a8a29e" style={{ marginTop: 1 }} />
                <Text style={[s.stepText, { color: '#a8a29e', fontSize: 12 }]}>
                  Für einen direkten „Teilen"-Button in Safari wäre eine Share Extension nötig — das ist in einer zukünftigen Version geplant.
                </Text>
              </View>
            </>
          ) : (
            <View style={s.importStep}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#22c55e" style={{ marginTop: 1 }} />
              <Text style={[s.stepText, { color: '#16a34a' }]}>
                Rezept in Chrome oder Firefox aufrufen → <Text style={s.bold}>Teilen → Kochwelt</Text> — fertig.
              </Text>
            </View>
          )}
        </View>

        {/* ── Erinnerungen ── */}
        <SectionHeader title="Erinnerungen" />
        <SettingsCard>
          <Row icon="notifications-outline" label="Häufigkeit">
            <View style={s.segRow}>
              {(['never', 'weekly', 'daily'] as ReminderFrequency[]).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[s.seg, settings.reminderFrequency === f && s.segActive]}
                  onPress={() => updateSettings({ reminderFrequency: f })}
                >
                  <Text style={[s.segText, settings.reminderFrequency === f && s.segTextActive]}>
                    {f === 'never' ? 'Nie' : f === 'weekly' ? 'Wöchentl.' : 'Täglich'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Row>

          {settings.reminderFrequency !== 'never' && (
            <>
              {settings.reminderFrequency === 'weekly' && (
                <Row icon="calendar-outline" label="Wochentag">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 200 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {[1, 2, 3, 4, 5, 6, 0].map(d => (
                        <TouchableOpacity
                          key={d}
                          style={[s.daySeg, settings.reminderWeekday === d && s.daySegActive]}
                          onPress={() => updateSettings({ reminderWeekday: d })}
                        >
                          <Text style={[s.daySegText, settings.reminderWeekday === d && s.daySegTextActive]}>
                            {WEEKDAY_LABELS[d].slice(0, 2)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </Row>
              )}
              <Row icon="time-outline" label="Uhrzeit" last>
                <View style={s.timeRow}>
                  <TouchableOpacity style={s.timeBtn} onPress={() => updateSettings({ reminderHour: (settings.reminderHour + 1) % 24 })}>
                    <Ionicons name="chevron-up" size={14} color="#f97316" />
                  </TouchableOpacity>
                  <Text style={s.timeValue}>{pad(settings.reminderHour)}</Text>
                  <TouchableOpacity style={s.timeBtn} onPress={() => updateSettings({ reminderHour: (settings.reminderHour + 23) % 24 })}>
                    <Ionicons name="chevron-down" size={14} color="#f97316" />
                  </TouchableOpacity>
                  <Text style={s.timeSep}>:</Text>
                  <TouchableOpacity style={s.timeBtn} onPress={() => updateSettings({ reminderMinute: (settings.reminderMinute + 15) % 60 })}>
                    <Ionicons name="chevron-up" size={14} color="#f97316" />
                  </TouchableOpacity>
                  <Text style={s.timeValue}>{pad(settings.reminderMinute)}</Text>
                  <TouchableOpacity style={s.timeBtn} onPress={() => updateSettings({ reminderMinute: (settings.reminderMinute + 45) % 60 })}>
                    <Ionicons name="chevron-down" size={14} color="#f97316" />
                  </TouchableOpacity>
                </View>
              </Row>
            </>
          )}
        </SettingsCard>

        {/* ── Ernährungsziele ── */}
        <SectionHeader title="Ernährungs- & Kalorienziele" />

        <View style={s.disclaimer}>
          <Ionicons name="information-circle-outline" size={16} color="#78716c" />
          <Text style={s.disclaimerText}>
            Diese Angaben dienen nur zur persönlichen Übersicht und Orientierung.
            Sie ersetzen keine Ernährungsberatung oder medizinische Empfehlung.
          </Text>
        </View>

        <SettingsCard>
          {([
            { key: 'kcal' as const,    label: 'Kalorien',       unit: 'kcal' },
            { key: 'protein' as const, label: 'Protein',        unit: 'g' },
            { key: 'carbs' as const,   label: 'Kohlenhydrate',  unit: 'g' },
            { key: 'fat' as const,     label: 'Fett',           unit: 'g' },
          ]).map(({ key, label, unit }, i, arr) => (
            <Row key={key} icon={key === 'kcal' ? 'flame-outline' : key === 'protein' ? 'barbell-outline' : key === 'fat' ? 'water-outline' : 'leaf-outline'} label={label} last={i === arr.length - 1}>
              <View style={s.goalInputRow}>
                <TextInput
                  style={s.goalInput}
                  keyboardType="numeric"
                  value={String(goals[key])}
                  onChangeText={v => updateGoal(key, v)}
                />
                <Text style={s.goalUnit}>{unit}</Text>
              </View>
            </Row>
          ))}
        </SettingsCard>

        <SectionHeader title="Mahlzeit-Verteilung" />
        <SettingsCard>
          {([
            { key: 'frueh' as const,  icon: 'sunny-outline',        label: 'Frühstück' },
            { key: 'mittag' as const, icon: 'partly-sunny-outline',  label: 'Mittag' },
            { key: 'abend' as const,  icon: 'moon-outline',          label: 'Abend' },
            { key: 'sonst' as const,  icon: 'cafe-outline',          label: 'Snacks' },
          ]).map(({ key, icon, label }, i, arr) => (
            <Row key={key} icon={icon} label={label} last={i === arr.length - 1}>
              <View style={s.splitCtrl}>
                <TouchableOpacity onPress={() => updateSplit(key, -5)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="remove-circle-outline" size={22} color="#f97316" />
                </TouchableOpacity>
                <Text style={s.splitPct}>{goals.splits[key]}%</Text>
                <TouchableOpacity onPress={() => updateSplit(key, 5)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="add-circle-outline" size={22} color="#f97316" />
                </TouchableOpacity>
              </View>
            </Row>
          ))}
          <View style={[s.splitTotal, splitsTotal !== 100 && s.splitTotalWarn]}>
            <Text style={[s.splitTotalText, splitsTotal !== 100 && s.splitTotalTextWarn]}>
              Gesamt: {splitsTotal}% {splitsTotal === 100 ? '✓' : '— muss 100% ergeben'}
            </Text>
          </View>
        </SettingsCard>

        {/* Speichern */}
        {(dirty || goalsDirty) && (
          <TouchableOpacity style={s.saveBtn} onPress={handleSaveAll}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
            <Text style={s.saveBtnText}>Einstellungen speichern</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f4' },
  navBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  navTitle: { fontSize: 24, fontWeight: '800', color: '#1c1917' },
  content: { padding: 16, gap: 8 },

  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: '#78716c',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginTop: 8, marginBottom: 4, marginLeft: 4,
  },

  card: {
    backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  rowIcon: { marginRight: 12 },
  rowLabel: { fontSize: 15, color: '#1c1917', fontWeight: '500', flex: 1 },
  rowRight: { alignItems: 'flex-end' },

  segRow: { flexDirection: 'row', gap: 6 },
  seg: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#f5f5f4', borderWidth: 1, borderColor: '#e7e5e4' },
  segActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  segText: { fontSize: 13, fontWeight: '600', color: '#57534e' },
  segTextActive: { color: '#ffffff' },

  daySeg: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f4', borderWidth: 1, borderColor: '#e7e5e4' },
  daySegActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  daySegText: { fontSize: 12, fontWeight: '600', color: '#57534e' },
  daySegTextActive: { color: '#ffffff' },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeBtn: { padding: 4 },
  timeValue: { fontSize: 18, fontWeight: '700', color: '#1c1917', minWidth: 28, textAlign: 'center' },
  timeSep: { fontSize: 18, fontWeight: '700', color: '#1c1917', marginHorizontal: 2 },

  goalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalInput: {
    backgroundColor: '#f5f5f4', borderRadius: 10, borderWidth: 1.5, borderColor: '#e7e5e4',
    paddingHorizontal: 10, paddingVertical: 6, fontSize: 15, fontWeight: '600',
    color: '#1c1917', minWidth: 72, textAlign: 'right',
  },
  goalUnit: { fontSize: 13, color: '#78716c', width: 28 },

  splitCtrl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  splitPct: { fontSize: 15, fontWeight: '700', color: '#1c1917', minWidth: 40, textAlign: 'center' },
  splitTotal: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f0fdf4' },
  splitTotalWarn: { backgroundColor: '#fff7ed' },
  splitTotalText: { fontSize: 13, fontWeight: '700', color: '#22c55e', textAlign: 'center' },
  splitTotalTextWarn: { color: '#f97316' },

  disclaimer: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#f5f5f4', borderRadius: 12,
    padding: 12, marginBottom: 4,
  },
  disclaimerText: { flex: 1, fontSize: 12, color: '#78716c', lineHeight: 18 },

  importCard: {
    backgroundColor: '#fff7ed', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#fed7aa', gap: 12,
  },
  importStep: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepBadge: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#f97316',
    alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
  },
  stepBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 14, color: '#57534e', lineHeight: 20 },
  bold: { fontWeight: '700', color: '#1c1917' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#f97316', borderRadius: 16, paddingVertical: 16, marginTop: 8,
  },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
