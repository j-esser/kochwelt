import { useCallback, useState } from 'react';
import {
  View, Text, TextInput, FlatList, ScrollView,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { RecipeImage } from '../../components/RecipeImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllRecipes, buildTeaser, RECIPE_TABS, type Recipe } from '../../services/recipeStore';
import { getCookCountsLastNDays } from '../../services/plannerStore';
import { completePick, cancelPick } from '../../services/recipePicker';

// ─── Smart Filters (identisch mit Rezepte-Screen) ────────────────────────────

const SMART_FILTERS: {
  id: string; label: string; icon: string; test: (r: Recipe) => boolean;
}[] = [
  { id: 'schnell',     label: 'Schnell',      icon: 'flash-outline',    test: r => r.cookTime <= 25 },
  { id: 'einfach',     label: 'Einfach',      icon: 'happy-outline',    test: r => r.ingredients.length <= 6 && r.cookTime <= 30 },
  { id: 'highprotein', label: 'High-Protein', icon: 'barbell-outline',  test: r => (r.nutrition?.protein ?? 0) / (r.portions || 1) >= 25 },
  { id: 'lowcarb',     label: 'Low-Carb',     icon: 'leaf-outline',     test: r => r.nutrition?.carbs != null && r.nutrition.carbs / (r.portions || 1) < 20 },
  { id: 'lowcal',      label: 'Low-Kalorie',  icon: 'flame-outline',    test: r => r.nutrition?.kcal != null && r.nutrition.kcal / (r.portions || 1) < 400 },
];

// ─── Picker Card ──────────────────────────────────────────────────────────────

function PickerCard({
  recipe, cookCount, portions, onPortionsChange, onSelect,
}: {
  recipe: Recipe;
  cookCount: number;
  portions: number;
  onPortionsChange: (n: number) => void;
  onSelect: () => void;
}) {
  const teaser = buildTeaser(recipe);
  return (
    <View style={s.card}>
      <RecipeImage uri={recipe.photo} style={s.cardThumb} />
      <View style={[s.cardBody]}>
      <View style={s.cardTop}>
        <Text style={s.cardTitle} numberOfLines={2}>{recipe.title}</Text>
        {cookCount > 0 && (
          <View style={s.cookBadge}>
            <Ionicons name="flame-outline" size={11} color="#f97316" />
            <Text style={s.cookBadgeText}>{cookCount}×</Text>
          </View>
        )}
      </View>
      {teaser.ingredients ? (
        <Text style={s.teaserText} numberOfLines={1}>{teaser.ingredients}</Text>
      ) : null}
      <View style={s.cardMeta}>
        <View style={s.metaChip}>
          <Ionicons name="time-outline" size={12} color="#a8a29e" />
          <Text style={s.metaText}>{recipe.cookTime} min</Text>
        </View>
        {recipe.nutrition?.kcal != null && (
          <View style={[s.metaChip, s.kcalChip]}>
            <Text style={s.kcalText}>{Math.round(recipe.nutrition.kcal / (recipe.portions || 1))} kcal/Port.</Text>
          </View>
        )}
      </View>
      <View style={s.cardBottom}>
        <View style={s.portionCtrl}>
          <TouchableOpacity onPress={() => onPortionsChange(Math.max(1, portions - 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="remove-circle-outline" size={22} color="#f97316" />
          </TouchableOpacity>
          <Text style={s.portionNum}>{portions} Port.</Text>
          <TouchableOpacity onPress={() => onPortionsChange(portions + 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="add-circle-outline" size={22} color="#f97316" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.selectBtn} onPress={onSelect}>
          <Text style={s.selectBtnText}>Wählen</Text>
        </TouchableOpacity>
      </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RecipePickScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cookCounts, setCookCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Alle');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [portions, setPortions] = useState<Record<string, number>>({});

  useFocusEffect(useCallback(() => {
    Promise.all([getAllRecipes(), getCookCountsLastNDays(28)]).then(([r, c]) => {
      setRecipes(r);
      setCookCounts(c);
    });
    return () => { /* cleanup */ };
  }, []));

  function toggleFilter(id: string) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSelect(recipe: Recipe) {
    const pts = portions[recipe.id] ?? recipe.portions;
    completePick(recipe.id, pts);
    router.back();
  }

  function handleClose() {
    cancelPick();
    router.back();
  }

  let filtered = recipes;
  if (activeTab === 'Ohne Kategorie') {
    filtered = filtered.filter(r => !r.categories || r.categories.length === 0);
  } else if (activeTab !== 'Alle') {
    filtered = filtered.filter(r => r.categories.includes(activeTab));
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.ingredients.some(i => i.name.toLowerCase().includes(q)) ||
      r.categories.some(c => c.toLowerCase().includes(q))
    );
  }
  for (const id of activeFilters) {
    const f = SMART_FILTERS.find(f => f.id === id);
    if (f) filtered = filtered.filter(f.test);
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.heading}>Rezept wählen</Text>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={24} color="#57534e" />
        </TouchableOpacity>
      </View>

      {/* Suche */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#a8a29e" />
        <TextInput
          style={s.searchInput}
          placeholder="Titel, Zutat suchen…"
          placeholderTextColor="#a8a29e"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#a8a29e" />
          </TouchableOpacity>
        )}
      </View>

      {/* Smart Filter Chips */}
      <View style={s.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterList}>
          {SMART_FILTERS.map(f => {
            const active = activeFilters.has(f.id);
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => toggleFilter(f.id)}
                style={[s.filterChip, active && s.filterChipActive]}
              >
                <Ionicons name={f.icon as any} size={13} color={active ? '#ffffff' : '#57534e'} />
                <Text style={[s.filterChipText, active && s.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Kategorie-Tabs */}
      <View style={s.tabRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabList}>
          {RECIPE_TABS.map(tab => {
            const active = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[s.tab, active && s.tabActive]}
              >
                <Text style={[s.tabText, active && s.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Rezept-Liste */}
      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={r => r.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <Text style={s.count}>{filtered.length} Rezept{filtered.length !== 1 ? 'e' : ''}</Text>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="book-outline" size={48} color="#d6d3d1" />
            <Text style={s.emptyText}>Keine Rezepte gefunden</Text>
          </View>
        }
        renderItem={({ item: r }) => (
          <PickerCard
            recipe={r}
            cookCount={cookCounts[r.id] ?? 0}
            portions={portions[r.id] ?? r.portions}
            onPortionsChange={n => setPortions(prev => ({ ...prev, [r.id]: n }))}
            onSelect={() => handleSelect(r)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f4' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  heading: { fontSize: 22, fontWeight: '800', color: '#1c1917' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ffffff', borderRadius: 14, marginHorizontal: 16, marginTop: 10, marginBottom: 6, paddingHorizontal: 12, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  searchInput: { flex: 1, fontSize: 15, color: '#1c1917' },

  filterRow: { flexShrink: 0 },
  filterList: { paddingHorizontal: 12, gap: 8, paddingVertical: 4 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e7e5e4' },
  filterChipActive: { backgroundColor: '#1c1917', borderColor: '#1c1917' },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#57534e' },
  filterChipTextActive: { color: '#ffffff' },

  tabRow: { paddingVertical: 4 },
  tabList: { paddingHorizontal: 12, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e7e5e4' },
  tabActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#57534e' },
  tabTextActive: { color: '#ffffff' },

  count: { fontSize: 12, color: '#a8a29e', paddingBottom: 8 },

  card: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardThumb: { width: '100%', height: 130 },
  cardBody: { padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  teaserText: { fontSize: 12, color: '#a8a29e', marginTop: 4, marginBottom: 2 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1c1917', lineHeight: 22 },
  cookBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#fff7ed', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, marginTop: 2 },
  cookBadgeText: { fontSize: 11, fontWeight: '700', color: '#f97316' },
  cardMeta: { flexDirection: 'row', gap: 8, marginTop: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f5f5f4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  kcalChip: { backgroundColor: '#fff7ed' },
  metaText: { fontSize: 12, color: '#78716c' },
  kcalText: { fontSize: 12, color: '#f97316', fontWeight: '600' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  portionCtrl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  portionNum: { fontSize: 14, fontWeight: '600', color: '#1c1917', minWidth: 52, textAlign: 'center' },
  selectBtn: { backgroundColor: '#f97316', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 },
  selectBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: '#a8a29e', marginTop: 12, fontSize: 16 },
});
