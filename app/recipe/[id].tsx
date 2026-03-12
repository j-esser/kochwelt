import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Linking, Alert,
  ActivityIndicator, StyleSheet, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRecipeById, deleteRecipe, type Recipe } from '../../services/recipeStore';
import {
  getCookCountsLastNDays, setMeal, weekStart, addDays, toDateKey,
  WEEKDAYS, WEEKDAYS_LONG, type MealSlot,
} from '../../services/plannerStore';

const SHOP_ICONS: Record<string, string> = {
  'Gemüse & Obst': 'leaf-outline',
  'Trockensortiment': 'layers-outline',
  'Tiefkühl': 'snow-outline',
  'Mopro': 'egg-outline',
  'Fleisch & Fisch': 'fish-outline',
  'Vorrat': 'archive-outline',
  'Sonstiges': 'bag-outline',
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [cookCount, setCookCount] = useState(0);

  // Planer-Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = diese Woche, 1 = nächste Woche
  const [selectedDay, setSelectedDay] = useState(0); // 0–6, Mo–So
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>('mittag');
  const [portions, setPortions] = useState(2);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const [r, counts] = await Promise.all([getRecipeById(id), getCookCountsLastNDays(28)]);
      setRecipe(r);
      setCookCount(counts[id] ?? 0);
      setLoading(false);
    })();
  }, [id]);

  function openModal() {
    if (!recipe) return;
    // Default: heutiger Wochentag (0=Mo…6=So), ansonsten Montag
    const today = new Date();
    const dayIndex = (today.getDay() + 6) % 7; // JS: 0=So → index 6; 1=Mo → index 0
    setWeekOffset(0);
    setSelectedDay(dayIndex);
    setSelectedSlot('mittag');
    setPortions(recipe.portions);
    setSaved(false);
    setModalVisible(true);
  }

  async function handleAdd() {
    if (!recipe) return;
    setSaving(true);
    const monday = weekStart(addDays(new Date(), weekOffset * 7));
    const dateKey = toDateKey(addDays(monday, selectedDay));
    await setMeal(dateKey, selectedSlot, { recipeId: recipe.id, portions });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setModalVisible(false), 900);
  }

  if (loading) {
    return <SafeAreaView style={s.center}><ActivityIndicator size="large" color="#f97316" /></SafeAreaView>;
  }
  if (!recipe) {
    return <SafeAreaView style={s.center}><Text style={{ color: '#a8a29e' }}>Rezept nicht gefunden</Text></SafeAreaView>;
  }

  const hasNutrition = recipe.nutrition &&
    (recipe.nutrition.kcal != null || recipe.nutrition.protein != null);

  function confirmDelete() {
    Alert.alert('Rezept löschen', `„${recipe!.title}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: async () => { await deleteRecipe(recipe!.id); router.back(); } },
    ]);
  }

  // Label für den gewählten Tag im Modal
  const monday = weekStart(addDays(new Date(), weekOffset * 7));
  const modalDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    return { label: WEEKDAYS[i], longLabel: WEEKDAYS_LONG[i], dateKey: toDateKey(d) };
  });

  return (
    <>
      <Stack.Screen options={{
        title: '',
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={() => router.push(`/recipe/edit/${recipe.id}`)}>
              <Text style={{ color: '#f97316', fontWeight: '600' }}>Bearbeiten</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ),
      }} />

      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header-Karte */}
        <View style={s.headerCard}>
          <Text style={s.title}>{recipe.title}</Text>

          <View style={s.metaRow}>
            <View style={s.chip}>
              <Ionicons name="time-outline" size={14} color="#78716c" />
              <Text style={s.chipText}>{recipe.cookTime} min</Text>
            </View>
            <View style={s.chip}>
              <Ionicons name="people-outline" size={14} color="#78716c" />
              <Text style={s.chipText}>{recipe.portions} Portionen</Text>
            </View>
            {recipe.categories.map(cat => (
              <View key={cat} style={s.catChip}>
                <Text style={s.catChipText}>{cat}</Text>
              </View>
            ))}
            {cookCount > 0 && (
              <View style={s.cookChip}>
                <Ionicons name="flame-outline" size={13} color="#f97316" />
                <Text style={s.cookChipText}>{cookCount}× in 4 Wochen</Text>
              </View>
            )}
          </View>

          {/* Nährwerte */}
          {hasNutrition && (
            <View style={s.nutritionBox}>
              {recipe.nutrition.kcal != null && (
                <View style={s.nutriItem}>
                  <Text style={s.nutriValue}>{Math.round(recipe.nutrition.kcal / (recipe.portions || 1))}</Text>
                  <Text style={s.nutriLabel}>kcal/Port.</Text>
                </View>
              )}
              {recipe.nutrition.protein != null && (
                <View style={s.nutriItem}>
                  <Text style={[s.nutriValue, { color: '#1c1917' }]}>{Math.round(recipe.nutrition.protein / (recipe.portions || 1))}g</Text>
                  <Text style={s.nutriLabel}>Eiweiß</Text>
                </View>
              )}
              {recipe.nutrition.fat != null && (
                <View style={s.nutriItem}>
                  <Text style={[s.nutriValue, { color: '#1c1917' }]}>{Math.round(recipe.nutrition.fat / (recipe.portions || 1))}g</Text>
                  <Text style={s.nutriLabel}>Fett</Text>
                </View>
              )}
              {recipe.nutrition.carbs != null && (
                <View style={s.nutriItem}>
                  <Text style={[s.nutriValue, { color: '#1c1917' }]}>{Math.round(recipe.nutrition.carbs / (recipe.portions || 1))}g</Text>
                  <Text style={s.nutriLabel}>Kohlenhydrate</Text>
                </View>
              )}
            </View>
          )}

          {/* Quelle */}
          {recipe.reference ? (
            recipe.reference.startsWith('http') ? (
              <TouchableOpacity style={s.sourceBtn} onPress={() => Linking.openURL(recipe.reference)}>
                <Ionicons name="open-outline" size={14} color="#f97316" />
                <Text style={s.sourceBtnText}>Quelle öffnen</Text>
              </TouchableOpacity>
            ) : (
              <Text style={s.sourceText}>📖 {recipe.reference}</Text>
            )
          ) : null}
        </View>

        {/* Zutaten */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Zutaten · {recipe.portions} Portionen</Text>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={[s.ingredientRow, i < recipe.ingredients.length - 1 && s.ingredientBorder]}>
              <Ionicons name={(SHOP_ICONS[ing.shopCategory] ?? 'ellipse-outline') as any} size={14} color="#a8a29e" style={s.ingredientIcon} />
              <Text style={s.ingredientAmount}>{ing.amount}</Text>
              <Text style={s.ingredientName}>{ing.name}</Text>
            </View>
          ))}
        </View>

        {/* Zubereitung */}
        {recipe.description ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Zubereitung</Text>
            <Text style={s.descriptionText}>{recipe.description}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Floating "Zum Planer"-Button */}
      <View style={s.fab} pointerEvents="box-none">
        <TouchableOpacity style={s.fabBtn} onPress={openModal} activeOpacity={0.85}>
          <Ionicons name="calendar-outline" size={18} color="#ffffff" />
          <Text style={s.fabText}>Zum Planer</Text>
        </TouchableOpacity>
      </View>

      {/* Planer-Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable style={s.modalBackdrop} onPress={() => setModalVisible(false)} />
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>Zum Wochenplaner</Text>

          {/* Woche */}
          <Text style={s.modalLabel}>Woche</Text>
          <View style={s.segmentRow}>
            {(['Diese Woche', 'Nächste Woche'] as const).map((label, i) => (
              <TouchableOpacity
                key={i}
                style={[s.segment, weekOffset === i && s.segmentActive]}
                onPress={() => setWeekOffset(i)}
              >
                <Text style={[s.segmentText, weekOffset === i && s.segmentTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tag */}
          <Text style={s.modalLabel}>Tag</Text>
          <View style={s.dayRow}>
            {modalDays.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[s.dayChip, selectedDay === i && s.dayChipActive]}
                onPress={() => setSelectedDay(i)}
              >
                <Text style={[s.dayChipText, selectedDay === i && s.dayChipTextActive]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Slot */}
          <Text style={s.modalLabel}>Mahlzeit</Text>
          <View style={s.segmentRow}>
            {(['mittag', 'abend'] as MealSlot[]).map(slot => (
              <TouchableOpacity
                key={slot}
                style={[s.segment, selectedSlot === slot && s.segmentActive]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Ionicons
                  name={slot === 'mittag' ? 'sunny-outline' : 'moon-outline'}
                  size={14}
                  color={selectedSlot === slot ? '#ffffff' : '#78716c'}
                />
                <Text style={[s.segmentText, selectedSlot === slot && s.segmentTextActive]}>
                  {slot === 'mittag' ? 'Mittag' : 'Abend'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Portionen */}
          <Text style={s.modalLabel}>Portionen</Text>
          <View style={s.portionRow}>
            <TouchableOpacity
              style={s.portionBtn}
              onPress={() => setPortions(p => Math.max(1, p - 1))}
            >
              <Ionicons name="remove" size={20} color="#f97316" />
            </TouchableOpacity>
            <Text style={s.portionValue}>{portions}</Text>
            <TouchableOpacity
              style={s.portionBtn}
              onPress={() => setPortions(p => Math.min(20, p + 1))}
            >
              <Ionicons name="add" size={20} color="#f97316" />
            </TouchableOpacity>
          </View>

          {/* Hinzufügen */}
          <TouchableOpacity
            style={[s.addBtn, saved && s.addBtnDone]}
            onPress={handleAdd}
            disabled={saving || saved}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : saved ? (
              <>
                <Ionicons name="checkmark" size={18} color="#ffffff" />
                <Text style={s.addBtnText}>Hinzugefügt!</Text>
              </>
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
                <Text style={s.addBtnText}>
                  + {WEEKDAYS_LONG[selectedDay]}, {selectedSlot === 'mittag' ? 'Mittag' : 'Abend'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f4' },

  headerCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1c1917', lineHeight: 28 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f5f5f4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  chipText: { fontSize: 13, color: '#57534e' },
  catChip: { backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  catChipText: { fontSize: 13, color: '#ea580c', fontWeight: '500' },
  cookChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#fed7aa' },
  cookChipText: { fontSize: 13, color: '#f97316', fontWeight: '600' },

  nutritionBox: {
    flexDirection: 'row',
    backgroundColor: '#fff7ed',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    justifyContent: 'space-around',
  },
  nutriItem: { alignItems: 'center' },
  nutriValue: { fontSize: 20, fontWeight: '700', color: '#f97316' },
  nutriLabel: { fontSize: 11, color: '#78716c', marginTop: 2 },

  sourceBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  sourceBtnText: { color: '#f97316', fontSize: 14, fontWeight: '500' },
  sourceText: { color: '#78716c', fontSize: 13, marginTop: 10 },

  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1c1917', marginBottom: 12 },

  ingredientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  ingredientBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  ingredientIcon: { fontSize: 16, width: 28 },
  ingredientAmount: { width: 90, fontSize: 13, color: '#78716c' },
  ingredientName: { flex: 1, fontSize: 14, color: '#1c1917' },

  descriptionText: { fontSize: 15, color: '#44403c', lineHeight: 24 },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f97316',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#f97316',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e7e5e4', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1c1917', marginBottom: 20 },
  modalLabel: { fontSize: 11, fontWeight: '600', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },

  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f5f5f4', borderWidth: 1.5, borderColor: 'transparent' },
  segmentActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#78716c' },
  segmentTextActive: { color: '#ffffff' },

  dayRow: { flexDirection: 'row', gap: 6 },
  dayChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: '#f5f5f4', borderWidth: 1.5, borderColor: 'transparent' },
  dayChipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  dayChipText: { fontSize: 13, fontWeight: '600', color: '#78716c' },
  dayChipTextActive: { color: '#ffffff' },

  portionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  portionBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' },
  portionValue: { fontSize: 22, fontWeight: '700', color: '#1c1917', minWidth: 32, textAlign: 'center' },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f97316', borderRadius: 16, paddingVertical: 16, marginTop: 24 },
  addBtnDone: { backgroundColor: '#22c55e' },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
