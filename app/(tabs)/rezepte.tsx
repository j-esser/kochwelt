import { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { RecipeImage } from '../../components/RecipeImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
// Stack is used to hide the default header
import { Ionicons } from '@expo/vector-icons';
import {
  getAllRecipes, buildTeaser, RECIPE_TABS,
  type Recipe,
} from '../../services/recipeStore';

// ─── Smart Filters ────────────────────────────────────────────────────────────

const SMART_FILTERS: {
  id: string;
  label: string;
  icon: string;
  test: (r: Recipe) => boolean;
}[] = [
  {
    id: 'schnell',
    label: 'Schnell',
    icon: 'flash-outline',
    test: r => r.cookTime <= 25,
  },
  {
    id: 'einfach',
    label: 'Einfach',
    icon: 'happy-outline',
    test: r => r.ingredients.length <= 6 && r.cookTime <= 30,
  },
  {
    id: 'highprotein',
    label: 'High-Protein',
    icon: 'barbell-outline',
    test: r => (r.nutrition?.protein ?? 0) / (r.portions || 1) >= 25,
  },
  {
    id: 'lowcarb',
    label: 'Low-Carb',
    icon: 'leaf-outline',
    test: r => r.nutrition?.carbs != null && r.nutrition.carbs / (r.portions || 1) < 20,
  },
  {
    id: 'lowcal',
    label: 'Low-Kalorie',
    icon: 'flame-outline',
    test: r => r.nutrition?.kcal != null && r.nutrition.kcal / (r.portions || 1) < 400,
  },
];
import { getCookCountsLastNDays, getCookDatesForRecipe } from '../../services/plannerStore';

// ─── Recipe Card ──────────────────────────────────────────────────────────────

function formatCookDates(dates: string[]): string {
  return dates.map(d => {
    const [, m, day] = d.split('-');
    return `${parseInt(day)}.${parseInt(m)}.`;
  }).join(', ');
}

function RecipeCard({ recipe, cookCount, onPress }: { recipe: Recipe; cookCount?: number; onPress: () => void }) {
  async function showCookDates() {
    const dates = await getCookDatesForRecipe(recipe.id, 28);
    Alert.alert('Gekocht am', formatCookDates(dates));
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.card}>
      <RecipeImage uri={recipe.photo} style={styles.cardThumb} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={2}>{recipe.title}</Text>
          {cookCount != null && cookCount > 0 && (
            <TouchableOpacity onPress={showCookDates} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <View style={styles.cookBadge}>
                <Ionicons name="flame-outline" size={11} color="#f97316" />
                <Text style={styles.cookBadgeText}>{cookCount}×</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        {buildTeaser(recipe).ingredients ? (
          <Text style={styles.teaserText} numberOfLines={1}>{buildTeaser(recipe).ingredients}</Text>
        ) : null}
        <View style={styles.cardMeta}>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={12} color="#a8a29e" />
            <Text style={styles.metaText}>{recipe.cookTime} min</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="people-outline" size={12} color="#a8a29e" />
            <Text style={styles.metaText}>{recipe.portions} Port.</Text>
          </View>
          {recipe.nutrition?.kcal != null && (
            <View style={[styles.metaChip, styles.kcalChip]}>
              <Text style={styles.kcalText}>{Math.round(recipe.nutrition.kcal / (recipe.portions || 1))} kcal/Port.</Text>
            </View>
          )}
        </View>
        {recipe.categories.length > 0 && (
          <View style={styles.catRow}>
            {recipe.categories.map(cat => (
              <View key={cat} style={styles.catBadge}>
                <Text style={styles.catText}>{cat}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RezepteScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Alle');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [cookCounts, setCookCounts] = useState<Record<string, number>>({});

  useFocusEffect(useCallback(() => {
    (async () => {
      const [allRecipes, counts] = await Promise.all([
        getAllRecipes(),
        getCookCountsLastNDays(28),
      ]);
      setRecipes(allRecipes);
      setCookCounts(counts);
      setLoading(false);
    })();
  }, []));

  const filtered = useMemo(() => {
    let list = recipes;
    if (activeTab === 'Ohne Kategorie') {
      list = list.filter(r => !r.categories || r.categories.length === 0);
    } else if (activeTab !== 'Alle') {
      list = list.filter(r => r.categories.includes(activeTab));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(q)) ||
        r.categories.some(c => c.toLowerCase().includes(q))
      );
    }
    for (const id of activeFilters) {
      const f = SMART_FILTERS.find(f => f.id === id);
      if (f) list = list.filter(f.test);
    }
    return list;
  }, [recipes, activeTab, search, activeFilters]);

  function toggleFilter(id: string) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ color: '#a8a29e', marginTop: 12 }}>Rezepte werden geladen…</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        {/* Eigener Header */}
        <View style={styles.navBar}>
          <Text style={styles.navTitle}>Meine Rezepte</Text>
          <View style={styles.navActions}>
            <TouchableOpacity onPress={() => router.push('/tools')} style={styles.toolsBtn}>
              <Ionicons name="swap-vertical-outline" size={20} color="#78716c" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/recipe/new')} style={styles.addBtn}>
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Suchfeld */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#a8a29e" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rezepte suchen…"
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
        <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {SMART_FILTERS.map(f => {
            const active = activeFilters.has(f.id);
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => toggleFilter(f.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Ionicons
                  name={f.icon as any}
                  size={13}
                  color={active ? '#ffffff' : '#57534e'}
                />
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        </View>

        {/* Kategorie-Tabs */}
        <View style={styles.tabRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabList}
          >
            {RECIPE_TABS.map(tab => {
              const active = tab === activeTab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tab, active && styles.tabActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
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
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <RecipeCard recipe={item} cookCount={cookCounts[item.id]} onPress={() => router.push(`/recipe/${item.id}`)} />
          )}
          ListHeaderComponent={
            <Text style={styles.count}>{filtered.length} Rezept{filtered.length !== 1 ? 'e' : ''}</Text>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="book-outline" size={48} color="#d6d3d1" />
              <Text style={{ color: '#a8a29e', marginTop: 12, fontSize: 16 }}>Keine Rezepte gefunden</Text>
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f4' },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  navTitle: { fontSize: 24, fontWeight: '800', color: '#1c1917' },

  navActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toolsBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f5f5f4', borderWidth: 1, borderColor: '#e7e5e4',
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    backgroundColor: '#f97316',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1c1917' },

  filterRow: { flexShrink: 0 },
  filterList: { paddingHorizontal: 12, gap: 8, paddingVertical: 4 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  filterChipActive: { backgroundColor: '#1c1917', borderColor: '#1c1917' },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#57534e' },
  filterChipTextActive: { color: '#ffffff' },

  tabRow: { paddingVertical: 4 },
  tabList: { paddingHorizontal: 12, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  tabActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#57534e' },
  tabTextActive: { color: '#ffffff' },

  teaserText: { fontSize: 12, color: '#a8a29e', marginTop: 4, marginBottom: 2 },
  count: { fontSize: 12, color: '#a8a29e', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardThumb: { width: '100%', height: 140 },
  cardBody: { padding: 16, paddingBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1c1917', lineHeight: 22 },
  cookBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#fff7ed', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, marginTop: 2 },
  cookBadgeText: { fontSize: 11, fontWeight: '700', color: '#f97316' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f5f4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaText: { fontSize: 12, color: '#78716c' },
  kcalChip: { backgroundColor: '#fff7ed' },
  kcalText: { fontSize: 12, color: '#f97316', fontWeight: '600' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingBottom: 2 },
  catBadge: {
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catText: { fontSize: 12, color: '#ea580c' },
});
