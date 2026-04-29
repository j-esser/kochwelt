import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, Pressable,
  TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getWeekPlan, setMeal, addSnack, removeSnack, weekStart, toDateKey, addDays,
  WEEKDAYS_LONG, type WeekPlan, type MealSlot, type PlannedMeal, type DayPlan,
} from '../../services/plannerStore';

import { getAllRecipes, seedIfEmpty, type Recipe } from '../../services/recipeStore';
import {
  getNutritionGoals, getMealDefaults, MEAL_TYPE_LABELS, DEFAULT_GOALS,
  type NutritionGoals, type MealSplits, type MealType,
} from '../../services/nutritionGoals';
import { registerPickCallback } from '../../services/recipePicker';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcDayNutrition(
  dayData: DayPlan,
  recipeMap: Record<string, Recipe>,
) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0;

  function addMeal(meal: PlannedMeal) {
    if (meal.manualNutrition) {
      kcal    += meal.manualNutrition.kcal;
      protein += meal.manualNutrition.protein;
      carbs   += meal.manualNutrition.carbs;
      fat     += meal.manualNutrition.fat;
      return;
    }
    if (!meal.recipeId) return;
    const r = recipeMap[meal.recipeId];
    if (!r?.nutrition) return;
    // Tagesziel zählt immer 1 Portion pro geplanter Mahlzeit — meal.portions ist nur für die Einkaufsliste relevant
    const factor = 1 / (r.portions || 1);
    if (r.nutrition.kcal != null) kcal += r.nutrition.kcal * factor;
    if (r.nutrition.protein != null) protein += r.nutrition.protein * factor;
    if (r.nutrition.carbs != null) carbs += r.nutrition.carbs * factor;
    if (r.nutrition.fat != null) fat += r.nutrition.fat * factor;
  }

  if (dayData.mittag) addMeal(dayData.mittag);
  if (dayData.abend) addMeal(dayData.abend);
  for (const snack of dayData.snacks ?? []) addMeal(snack);

  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

function barColor(actual: number, goal: number): string {
  if (goal <= 0) return '#f97316';
  const pct = actual / goal;
  if (pct > 1.05) return '#ef4444';
  if (pct >= 0.75) return '#22c55e';
  return '#f97316';
}

function splitsTotal(s: MealSplits) {
  return s.frueh + s.mittag + s.abend + s.sonst;
}

// ─── Day Nutrition Bar ────────────────────────────────────────────────────────

function DayNutritionBar({
  nutrition, goals,
}: {
  nutrition: { kcal: number; protein: number; carbs: number; fat: number };
  goals: NutritionGoals;
}) {
  const hasData = nutrition.kcal > 0 || nutrition.protein > 0 || nutrition.carbs > 0 || nutrition.fat > 0;
  if (!hasData) return null;

  const rows: {
    icon: string;
    label: string;
    value: number;
    goal: number;
    unit: string;
  }[] = [
    { icon: 'flame-outline',   label: 'Kalorien',      value: nutrition.kcal,     goal: goals.kcal,    unit: 'kcal' },
    { icon: 'barbell-outline', label: 'Protein',        value: nutrition.protein,  goal: goals.protein, unit: 'g' },
    { icon: 'leaf-outline',    label: 'KH',             value: nutrition.carbs,    goal: goals.carbs,   unit: 'g' },
    { icon: 'water-outline',   label: 'Fett',           value: nutrition.fat,      goal: goals.fat,     unit: 'g' },
  ];

  return (
    <View style={nb.wrap}>
      <View style={nb.divider} />
      {rows.map(({ icon, label, value, goal, unit }) => {
        if (value === 0 && goal === 0) return null;
        const pct = goal > 0 ? Math.round((value / goal) * 100) : 0;
        const fillPct = goal > 0 ? Math.min(value / goal, 1) * 100 : 0;
        const color = barColor(value, goal);
        const isKcal = unit === 'kcal';
        return (
          <View key={label} style={nb.row}>
            <View style={nb.labelCol}>
              <Ionicons name={icon as any} size={13} color={color} />
              <Text style={[nb.label, { color }]}>{label}</Text>
            </View>
            <View style={nb.barCol}>
              <View style={nb.track}>
                <View
                  style={[
                    nb.fill,
                    { width: `${fillPct}%` as any, backgroundColor: color },
                    isKcal && nb.fillThick,
                  ]}
                />
              </View>
            </View>
            <View style={nb.valueCol}>
              <Text style={[nb.pct, { color }]}>{pct}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const nb = StyleSheet.create({
  wrap: { marginTop: 6 },
  divider: { height: 1, backgroundColor: '#f0efee', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  labelCol: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 86 },
  label: { fontSize: 11, fontWeight: '600' },
  barCol: { flex: 1, marginLeft: 4, marginRight: 8 },
  track: { height: 7, backgroundColor: '#f0efee', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  fillThick: { height: '100%' },
  valueCol: { alignItems: 'flex-end', width: 36 },
  pct: { fontSize: 11, fontWeight: '700', textAlign: 'right' },
});

// ─── Nutrition Goals Modal ────────────────────────────────────────────────────

const SPLIT_ROWS: { key: keyof MealSplits; icon: string; label: string }[] = [
  { key: 'frueh',  icon: 'sunny-outline',    label: 'Frühstück' },
  { key: 'mittag', icon: 'partly-sunny-outline', label: 'Mittagessen' },
  { key: 'abend',  icon: 'moon-outline',     label: 'Abendessen' },
  { key: 'sonst',  icon: 'cafe-outline',     label: 'Zwischendurch' },
];

function NutritionGoalsModal({
  visible, goals, onClose, onSave,
}: {
  visible: boolean;
  goals: NutritionGoals;
  onClose: () => void;
  onSave: (goals: NutritionGoals) => void;
}) {
  function safeSplits(g: NutritionGoals): NutritionGoals {
    return { ...DEFAULT_GOALS, ...g, splits: { ...DEFAULT_GOALS.splits, ...(g.splits ?? {}) } };
  }

  const [draft, setDraft] = useState<NutritionGoals>(() => safeSplits(goals));

  useEffect(() => {
    if (visible) setDraft(safeSplits(goals));
  }, [visible, goals]);

  function setGoalField(key: keyof Omit<NutritionGoals, 'splits'>, raw: string) {
    const n = parseInt(raw, 10);
    setDraft(prev => ({ ...prev, [key]: isNaN(n) ? 0 : n }));
  }

  function adjustSplit(key: keyof MealSplits, delta: number) {
    setDraft(prev => {
      const next = Math.min(100, Math.max(0, (prev.splits[key] ?? 0) + delta));
      return { ...prev, splits: { ...prev.splits, [key]: next } };
    });
  }

  const total = splitsTotal(draft.splits);
  const totalOk = total === 100;

  function handleSave() {
    onSave(draft);
    onClose();
  }

  function handleReset() {
    setDraft({ ...DEFAULT_GOALS, splits: { ...DEFAULT_GOALS.splits } });
  }

  function goalRow(label: string, unit: string, key: keyof Omit<NutritionGoals, 'splits'>) {
    return (
      <View style={gm.row} key={key}>
        <Text style={gm.rowLabel}>{label}</Text>
        <View style={gm.inputWrap}>
          <TextInput
            style={gm.input}
            keyboardType="numeric"
            value={String(draft[key])}
            onChangeText={v => setGoalField(key, v)}
          />
          <Text style={gm.unit}>{unit}</Text>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={gm.screen} edges={['top']}>
        <View style={gm.header}>
          <Text style={gm.title}>Tagesziele</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#57534e" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
          {/* ── Nährwert-Ziele ── */}
          <Text style={gm.sectionTitle}>Tägliche Ziele</Text>
          <View style={gm.card}>
            {goalRow('Kalorien', 'kcal', 'kcal')}
            {goalRow('Protein', 'g', 'protein')}
            {goalRow('Kohlenhydrate', 'g', 'carbs')}
            {goalRow('Fett', 'g', 'fat')}
          </View>

          {/* ── Mahlzeit-Verteilung ── */}
          <Text style={gm.sectionTitle}>Mahlzeit-Verteilung</Text>
          <Text style={gm.sectionHint}>
            Wie viel Prozent deines Tagesziels soll jede Mahlzeit ausmachen?
          </Text>
          <View style={gm.card}>
            {SPLIT_ROWS.map(({ key, icon, label }) => {
              const val = draft.splits[key] ?? 0;
              const kcalForMeal = Math.round(draft.kcal * val / 100);
              return (
                <View style={gm.splitRow} key={key}>
                  <Ionicons name={icon as any} size={15} color="#78716c" />
                  <Text style={gm.splitLabel}>{label}</Text>
                  <View style={gm.splitCtrl}>
                    <TouchableOpacity onPress={() => adjustSplit(key, -5)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="remove-circle-outline" size={22} color="#f97316" />
                    </TouchableOpacity>
                    <Text style={gm.splitPct}>{val}%</Text>
                    <TouchableOpacity onPress={() => adjustSplit(key, 5)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="add-circle-outline" size={22} color="#f97316" />
                    </TouchableOpacity>
                  </View>
                  <Text style={gm.splitKcal}>{kcalForMeal} kcal</Text>
                </View>
              );
            })}
            <View style={[gm.splitTotalRow, !totalOk && gm.splitTotalRowWarn]}>
              <Text style={[gm.splitTotalText, !totalOk && gm.splitTotalTextWarn]}>
                Gesamt: {total}% {totalOk ? '✓' : '— muss 100% ergeben'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={gm.saveBtn} onPress={handleSave}>
            <Text style={gm.saveBtnText}>Ziele speichern</Text>
          </TouchableOpacity>

          <TouchableOpacity style={gm.resetBtn} onPress={handleReset}>
            <Text style={gm.resetBtnText}>Standardwerte wiederherstellen</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const gm = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  title: { fontSize: 18, fontWeight: '700', color: '#1c1917' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#78716c', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 8 },
  sectionHint: { fontSize: 13, color: '#a8a29e', marginBottom: 10, lineHeight: 18 },
  card: { backgroundColor: '#f5f5f4', borderRadius: 16, overflow: 'hidden', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#e7e5e4' },
  rowLabel: { fontSize: 15, fontWeight: '500', color: '#1c1917' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: { backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1.5, borderColor: '#e7e5e4', paddingHorizontal: 12, paddingVertical: 7, fontSize: 15, fontWeight: '600', color: '#1c1917', minWidth: 80, textAlign: 'right' },
  unit: { fontSize: 14, color: '#78716c', width: 30 },

  splitRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#e7e5e4', gap: 8 },
  splitLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1c1917' },
  splitCtrl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  splitPct: { fontSize: 15, fontWeight: '700', color: '#1c1917', minWidth: 38, textAlign: 'center' },
  splitKcal: { fontSize: 12, color: '#a8a29e', minWidth: 58, textAlign: 'right' },
  splitTotalRow: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f0fdf4' },
  splitTotalRowWarn: { backgroundColor: '#fff7ed' },
  splitTotalText: { fontSize: 13, fontWeight: '700', color: '#22c55e', textAlign: 'center' },
  splitTotalTextWarn: { color: '#f97316' },

  saveBtn: { backgroundColor: '#f97316', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20, marginBottom: 12 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  resetBtn: { alignItems: 'center', paddingVertical: 10 },
  resetBtnText: { fontSize: 14, color: '#a8a29e' },
});

// ─── Main Planer Screen ───────────────────────────────────────────────────────

export default function PlanerScreen() {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({});
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);

  // Kalte Küche / Snack Modal
  const [coldTarget, setColdTarget] = useState<{ date: string; slot: MealSlot } | null>(null);
  const [isSnack, setIsSnack] = useState(false);
  const [mealType, setMealType] = useState<MealType>('mittag');
  const [coldTitle, setColdTitle] = useState('');
  const [coldKcal, setColdKcal] = useState('');
  const [coldProtein, setColdProtein] = useState('');
  const [coldFat, setColdFat] = useState('');
  const [coldCarbs, setColdCarbs] = useState('');

  function applyMealTypeDefaults(type: MealType) {
    const def = getMealDefaults(goals, type);
    setColdKcal(String(def.kcal));
    setColdProtein(String(def.protein));
    setColdFat(String(def.fat));
    setColdCarbs(String(def.carbs));
  }

  function selectMealType(type: MealType) {
    setMealType(type);
    applyMealTypeDefaults(type);
  }

  function openColdMeal(date: string, slot: MealSlot) {
    setColdTarget({ date, slot });
    setIsSnack(false);
    setMealType(slot);
    setColdTitle('');
    applyMealTypeDefaults(slot);
  }

  function openSnackModal(date: string) {
    setColdTarget({ date, slot: 'mittag' }); // slot wird für Snacks nicht genutzt
    setIsSnack(true);
    setMealType('sonst');
    setColdTitle('');
    applyMealTypeDefaults('sonst');
  }

  async function handleSaveColdMeal() {
    if (!coldTarget) return;
    const meal: PlannedMeal = {
      portions: 1,
      manualTitle: coldTitle.trim() || (isSnack ? 'Snack' : 'Kalte Küche'),
      manualNutrition: {
        kcal: parseInt(coldKcal) || 0,
        protein: parseInt(coldProtein) || 0,
        fat: parseInt(coldFat) || 0,
        carbs: parseInt(coldCarbs) || 0,
      },
    };
    if (isSnack) {
      await addSnack(coldTarget.date, meal);
    } else {
      await setMeal(coldTarget.date, coldTarget.slot, meal);
    }
    setWeekPlan(await getWeekPlan());
    setColdTarget(null);
    setIsSnack(false);
  }

  async function handleRemoveSnack(date: string, index: number) {
    await removeSnack(date, index);
    setWeekPlan(await getWeekPlan());
  }

  const monday = addDays(weekStart(new Date()), weekOffset * 7);

  useFocusEffect(useCallback(() => {
    (async () => {
      await seedIfEmpty();
      const [recipes, plan, loadedGoals] = await Promise.all([
        getAllRecipes(),
        getWeekPlan(),
        getNutritionGoals(),
      ]);
      setAllRecipes(recipes);
      setWeekPlan(plan);
      setGoals(loadedGoals);
    })();
  }, [weekOffset]));

  function openPicker(date: string, slot: MealSlot) {
    registerPickCallback(async (recipeId, portions) => {
      await setMeal(date, slot, { recipeId, portions });
    });
    router.push('/recipe/pick');
  }

  async function handleRemove(date: string, slot: MealSlot) {
    Alert.alert('Mahlzeit entfernen', 'Eintrag aus dem Planer löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Entfernen', style: 'destructive',
        onPress: async () => {
          await setMeal(date, slot, null);
          setWeekPlan(await getWeekPlan());
        },
      },
    ]);
  }


  const recipeMap = Object.fromEntries(allRecipes.map(r => [r.id, r]));

  const weekLabel = (() => {
    const end = addDays(monday, 6);
    const fmt = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}.`;
    return `${fmt(monday)} – ${fmt(end)}${weekOffset === 0 ? ' (diese Woche)' : ''}`;
  })();

  return (
    <SafeAreaView style={ss.screen} edges={['top']}>
      {/* Header */}
      <View style={ss.topBar}>
        <Text style={ss.heading}>Wochenplaner</Text>
        <TouchableOpacity style={ss.goalsBtn} onPress={() => router.push('/(tabs)/einstellungen')}>
          <Ionicons name="nutrition-outline" size={15} color="#f97316" />
          <Text style={ss.goalsBtnText}>Ziele</Text>
        </TouchableOpacity>
      </View>

      {/* Woche navigieren */}
      <View style={ss.weekNav}>
        <TouchableOpacity onPress={() => setWeekOffset(w => w - 1)} style={ss.navBtn}>
          <Ionicons name="chevron-back" size={20} color="#57534e" />
        </TouchableOpacity>
        <Text style={ss.weekLabel}>{weekLabel}</Text>
        <TouchableOpacity onPress={() => setWeekOffset(w => w + 1)} style={ss.navBtn}>
          <Ionicons name="chevron-forward" size={20} color="#57534e" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {Array.from({ length: 7 }, (_, i) => {
          const date = addDays(monday, i);
          const key = toDateKey(date);
          const dayData = weekPlan[key] ?? {};
          const isToday = toDateKey(new Date()) === key;
          const nutrition = calcDayNutrition(dayData, recipeMap);

          return (
            <View key={key} style={[ss.dayCard, isToday && ss.dayCardToday]}>
              <View style={ss.dayHeader}>
                <View style={[ss.dayDot, isToday && ss.dayDotToday]} />
                <Text style={[ss.dayName, isToday && ss.dayNameToday]}>
                  {WEEKDAYS_LONG[i]}
                </Text>
                <Text style={ss.dayDate}>{date.getDate()}.{date.getMonth() + 1}.</Text>
              </View>

              {(['mittag', 'abend'] as MealSlot[]).map(slot => {
                const meal = slot === 'mittag' ? dayData.mittag : dayData.abend;
                const recipe = (meal?.recipeId) ? recipeMap[meal.recipeId] : null;
                const isManual = meal && !meal.recipeId && !!meal.manualTitle;

                return (
                  <View key={slot} style={ss.slotRow}>
                    <View style={ss.slotLabelRow}>
                      <Ionicons name={slot === 'mittag' ? 'sunny-outline' : 'moon-outline'} size={12} color="#78716c" />
                      <Text style={ss.slotLabel}>{slot === 'mittag' ? 'Mittag' : 'Abend'}</Text>
                    </View>
                    {recipe ? (
                      <View style={ss.mealChip}>
                        <View style={{ flex: 1 }}>
                          <Text style={ss.mealTitle} numberOfLines={1}>{recipe.title}</Text>
                          <Text style={ss.mealMeta}>{meal!.portions} Port.{recipe.nutrition?.kcal ? ` · ${Math.round(recipe.nutrition.kcal / (recipe.portions || 1))} kcal/Port.` : ''}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleRemove(key, slot)} style={ss.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Ionicons name="close-circle" size={18} color="#f97316" />
                        </TouchableOpacity>
                      </View>
                    ) : isManual ? (
                      <View style={[ss.mealChip, ss.mealChipCold]}>
                        <View style={{ flex: 1 }}>
                          <Text style={ss.mealTitle} numberOfLines={1}>{meal!.manualTitle}</Text>
                          <Text style={ss.mealMeta}>{meal!.manualNutrition?.kcal ?? 0} kcal</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleRemove(key, slot)} style={ss.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Ionicons name="close-circle" size={18} color="#78716c" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={ss.emptySlotWrap}>
                        <TouchableOpacity style={ss.emptySlotBtn} onPress={() => openPicker(key, slot)}>
                          <Ionicons name="restaurant-outline" size={14} color="#a8a29e" />
                          <Text style={ss.emptySlotText}>Rezept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={ss.emptySlotBtn} onPress={() => openColdMeal(key, slot)}>
                          <Ionicons name="snow-outline" size={14} color="#a8a29e" />
                          <Text style={ss.emptySlotText}>Kalte Küche</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Snacks */}
              {(dayData.snacks ?? []).map((snack, idx) => (
                <View key={`snack-${idx}`} style={ss.slotRow}>
                  <View style={ss.slotLabelRow}>
                    <Ionicons name="cafe-outline" size={12} color="#78716c" />
                    <Text style={ss.slotLabel}>Snack</Text>
                  </View>
                  <View style={[ss.mealChip, ss.mealChipSnack]}>
                    <View style={{ flex: 1 }}>
                      <Text style={ss.mealTitle} numberOfLines={1}>{snack.manualTitle || 'Snack'}</Text>
                      <Text style={ss.mealMeta}>{snack.manualNutrition?.kcal ?? 0} kcal</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveSnack(key, idx)} style={ss.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={18} color="#78716c" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Snack hinzufügen */}
              <TouchableOpacity style={ss.addSnackBtn} onPress={() => openSnackModal(key)}>
                <Ionicons name="add-circle-outline" size={13} color="#a8a29e" />
                <Text style={ss.addSnackText}>Snack hinzufügen</Text>
              </TouchableOpacity>

              <DayNutritionBar nutrition={nutrition} goals={goals} />
            </View>
          );
        })}
      </ScrollView>

      {/* Kalte Küche / Snack Modal */}
      <Modal visible={!!coldTarget} animationType="slide" transparent onRequestClose={() => { setColdTarget(null); setIsSnack(false); }}>
        <Pressable
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)' }]}
          onPress={() => { setColdTarget(null); setIsSnack(false); }}
        />
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
          <View style={ss.modalSheet}>
            <View style={ss.modalHandle} />
            <Text style={ss.modalTitle}>{isSnack ? 'Snack / Zwischenmahlzeit' : 'Kalte Küche / Snack'}</Text>

            <Text style={ss.modalLabel}>Mahlzeit-Typ</Text>
            <Text style={ss.modalHint}>Vorbelegung der Werte aus deinen Tageszielen × Anteil.</Text>
            <View style={ss.typeChipRow}>
              {(['frueh', 'mittag', 'abend', 'sonst'] as MealType[]).map(t => {
                const active = mealType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => selectMealType(t)}
                    style={[ss.typeChip, active && ss.typeChipActive]}
                  >
                    <Text style={[ss.typeChipText, active && ss.typeChipTextActive]}>
                      {MEAL_TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={ss.modalLabel}>Bezeichnung (optional)</Text>
            <TextInput
              style={ss.coldInput}
              placeholder={isSnack ? 'z.B. Apfel & Nüsse' : 'z.B. Brot & Käse'}
              placeholderTextColor="#a8a29e"
              value={coldTitle}
              onChangeText={setColdTitle}
              returnKeyType="next"
            />

            <Text style={ss.modalLabel}>Nährwerte (pro Portion)</Text>
            <Text style={ss.modalHint}>Werte zählen als 1 Portion direkt zum Tagesziel.</Text>
            <View style={ss.coldRow}>
              {([
                { label: 'kcal', value: coldKcal, set: setColdKcal },
                { label: 'Protein g', value: coldProtein, set: setColdProtein },
                { label: 'Fett g', value: coldFat, set: setColdFat },
                { label: 'KH g', value: coldCarbs, set: setColdCarbs },
              ] as const).map(({ label, value, set }) => (
                <View key={label} style={ss.coldField}>
                  <TextInput
                    style={ss.coldNumInput}
                    keyboardType="numeric"
                    value={value}
                    onChangeText={set as (v: string) => void}
                    returnKeyType="done"
                  />
                  <Text style={ss.coldUnit}>{label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={ss.addBtn} onPress={handleSaveColdMeal} activeOpacity={0.85}>
              <Ionicons name="checkmark" size={18} color="#ffffff" />
              <Text style={ss.addBtnText}>Eintragen</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f4' },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  heading: { fontSize: 24, fontWeight: '800', color: '#1c1917' },
  goalsBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff7ed', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#fed7aa' },
  goalsBtnText: { fontSize: 13, fontWeight: '600', color: '#f97316' },

  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  navBtn: { padding: 6, backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#e7e5e4' },
  weekLabel: { fontSize: 14, fontWeight: '500', color: '#57534e' },

  dayCard: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 10, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  dayCardToday: { borderWidth: 2, borderColor: '#f97316' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  dayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d6d3d1' },
  dayDotToday: { backgroundColor: '#f97316' },
  dayName: { fontSize: 15, fontWeight: '700', color: '#1c1917', flex: 1 },
  dayNameToday: { color: '#f97316' },
  dayDate: { fontSize: 13, color: '#a8a29e' },

  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  slotLabelRow: { width: 68, flexDirection: 'row', alignItems: 'center', gap: 4 },
  slotLabel: { fontSize: 12, color: '#78716c' },

  mealChip: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', borderRadius: 12, padding: 10 },
  removeBtn: { marginLeft: 6 },
  mealTitle: { fontSize: 13, fontWeight: '600', color: '#1c1917' },
  mealMeta: { fontSize: 11, color: '#f97316', marginTop: 2 },

  emptySlot: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#e7e5e4', borderStyle: 'dashed', borderRadius: 12, padding: 10 },
  emptySlotWrap: { flex: 1, flexDirection: 'row', gap: 6 },
  emptySlotBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderColor: '#e7e5e4', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 9 },
  emptySlotText: { fontSize: 12, color: '#a8a29e' },

  mealChipCold: { backgroundColor: '#f0f9ff' },
  mealChipSnack: { backgroundColor: '#f0fdf4' },

  addSnackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 8, paddingVertical: 6 },
  addSnackText: { fontSize: 12, color: '#a8a29e' },

  // Modal Kalte Küche / Snack
  modalSheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e7e5e4', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1c1917', marginBottom: 20 },
  modalLabel: { fontSize: 11, fontWeight: '600', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  modalHint: { fontSize: 12, color: '#a8a29e', marginTop: -4, marginBottom: 8, lineHeight: 16 },

  typeChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#e7e5e4', backgroundColor: '#ffffff' },
  typeChipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  typeChipText: { fontSize: 13, fontWeight: '500', color: '#57534e' },
  typeChipTextActive: { color: '#ffffff' },

  coldInput: { backgroundColor: '#f5f5f4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#1c1917' },
  coldRow: { flexDirection: 'row', gap: 8 },
  coldField: { flex: 1, alignItems: 'center', gap: 4 },
  coldNumInput: { width: '100%', backgroundColor: '#f5f5f4', borderRadius: 10, paddingVertical: 10, fontSize: 16, fontWeight: '700', color: '#1c1917', textAlign: 'center' },
  coldUnit: { fontSize: 11, color: '#78716c', textAlign: 'center' },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f97316', borderRadius: 16, paddingVertical: 16, marginTop: 24 },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
