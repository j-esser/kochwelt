import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  FlatList, TextInput, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getWeekPlan, setMeal, weekStart, toDateKey, addDays,
  WEEKDAYS, WEEKDAYS_LONG, type WeekPlan, type MealSlot,
} from '../../services/plannerStore';
import { getAllRecipes, seedIfEmpty, type Recipe } from '../../services/recipeStore';

// ─── Recipe Picker Modal ──────────────────────────────────────────────────────

function RecipePicker({
  visible, onClose, onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (recipe: Recipe, portions: number) => void;
}) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [portions, setPortions] = useState<Record<string, number>>({});

  useFocusEffect(useCallback(() => {
    getAllRecipes().then(setRecipes);
  }, []));

  const filtered = search.trim()
    ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={p.screen} edges={['top']}>
        <View style={p.header}>
          <Text style={p.headerTitle}>Rezept wählen</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#57534e" />
          </TouchableOpacity>
        </View>
        <View style={p.searchWrap}>
          <Ionicons name="search-outline" size={15} color="#a8a29e" />
          <TextInput
            style={p.searchInput}
            placeholder="Suchen…"
            placeholderTextColor="#a8a29e"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={r => r.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item: r }) => {
            const pts = portions[r.id] ?? r.portions;
            return (
              <View style={p.recipeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={p.recipeTitle} numberOfLines={2}>{r.title}</Text>
                  <Text style={p.recipeMeta}>{r.cookTime} min · {r.categories[0] ?? '—'}</Text>
                </View>
                <View style={p.portionCtrl}>
                  <TouchableOpacity onPress={() => setPortions(prev => ({ ...prev, [r.id]: Math.max(1, pts - 1) }))}>
                    <Ionicons name="remove-circle-outline" size={20} color="#f97316" />
                  </TouchableOpacity>
                  <Text style={p.portionNum}>{pts}</Text>
                  <TouchableOpacity onPress={() => setPortions(prev => ({ ...prev, [r.id]: pts + 1 }))}>
                    <Ionicons name="add-circle-outline" size={20} color="#f97316" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={p.addBtn} onPress={() => { onSelect(r, pts); onClose(); }}>
                  <Text style={p.addBtnText}>Wählen</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const p = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1c1917' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f5f5f4', borderRadius: 12, margin: 16, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1c1917' },
  recipeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f4', gap: 10 },
  recipeTitle: { fontSize: 14, fontWeight: '600', color: '#1c1917' },
  recipeMeta: { fontSize: 12, color: '#a8a29e', marginTop: 2 },
  portionCtrl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  portionNum: { fontSize: 15, fontWeight: '600', color: '#1c1917', minWidth: 18, textAlign: 'center' },
  addBtn: { backgroundColor: '#f97316', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
});

// ─── Main Planer Screen ───────────────────────────────────────────────────────

export default function PlanerScreen() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({});
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [pickerTarget, setPickerTarget] = useState<{ date: string; slot: MealSlot } | null>(null);

  const monday = addDays(weekStart(new Date()), weekOffset * 7);

  useFocusEffect(useCallback(() => {
    (async () => {
      await seedIfEmpty();
      setAllRecipes(await getAllRecipes());
      setWeekPlan(await getWeekPlan());
    })();
  }, [weekOffset]));

  async function handleSelect(recipe: Recipe, portions: number) {
    if (!pickerTarget) return;
    await setMeal(pickerTarget.date, pickerTarget.slot, { recipeId: recipe.id, portions });
    setWeekPlan(await getWeekPlan());
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

  // weekly kcal (sum of kcal/Port. per planned meal)
  let totalKcal = 0;
  for (let i = 0; i < 7; i++) {
    const key = toDateKey(addDays(monday, i));
    const day = weekPlan[key];
    if (!day) continue;
    for (const meal of Object.values(day)) {
      const r = recipeMap[meal.recipeId];
      if (r?.nutrition?.kcal != null) {
        totalKcal += Math.round(r.nutrition.kcal / (r.portions || 2));
      }
    }
  }

  return (
    <SafeAreaView style={ss.screen} edges={['top']}>
      {/* Header */}
      <View style={ss.topBar}>
        <Text style={ss.heading}>Wochenplaner</Text>
        {totalKcal > 0 && (
          <View style={ss.kcalBadge}>
            <Text style={ss.kcalText}>{totalKcal} kcal/Port. p. Woche</Text>
          </View>
        )}
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
                const meal = dayData[slot];
                const recipe = meal ? recipeMap[meal.recipeId] : null;

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
                          <Text style={ss.mealMeta}>{meal!.portions} Port.{recipe.nutrition?.kcal ? ` · ${Math.round(recipe.nutrition.kcal / (recipe.portions || 2))} kcal/Port.` : ''}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleRemove(key, slot)} style={ss.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Ionicons name="close-circle" size={18} color="#f97316" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={ss.emptySlot}
                        onPress={() => setPickerTarget({ date: key, slot })}
                      >
                        <Ionicons name="add" size={16} color="#a8a29e" />
                        <Text style={ss.emptySlotText}>Rezept hinzufügen</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <RecipePicker
        visible={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={handleSelect}
      />
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f4' },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  heading: { fontSize: 24, fontWeight: '800', color: '#1c1917' },
  kcalBadge: { backgroundColor: '#fff7ed', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  kcalText: { fontSize: 12, color: '#f97316', fontWeight: '600' },

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
  emptySlotText: { fontSize: 13, color: '#a8a29e' },
});
