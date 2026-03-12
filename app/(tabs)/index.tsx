import { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllRecipes, seedIfEmpty, RECIPE_TABS,
  type Recipe,
} from '../../services/recipeStore';

// ─── Recipe Card ──────────────────────────────────────────────────────────────

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={2}>{recipe.title}</Text>
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
            <Text style={styles.kcalText}>{recipe.nutrition.kcal} kcal</Text>
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

  useFocusEffect(useCallback(() => {
    (async () => {
      await seedIfEmpty();
      setRecipes(await getAllRecipes());
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
    return list;
  }, [recipes, activeTab, search]);

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
      <Stack.Screen
        options={{
          title: 'Meine Rezepte',
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/recipe/new')}
              style={styles.addBtn}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.screen} edges={['bottom']}>
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

        {/* Kategorie-Tabs */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={RECIPE_TABS}
          keyExtractor={t => t}
          contentContainerStyle={styles.tabList}
          renderItem={({ item: tab }) => {
            const active = tab === activeTab;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Rezept-Liste */}
        <FlatList
          data={filtered}
          keyExtractor={r => r.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <RecipeCard recipe={item} onPress={() => router.push(`/recipe/${item.id}`)} />
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

  tabList: { paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
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

  count: { fontSize: 12, color: '#a8a29e', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1c1917', lineHeight: 22 },
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
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  catBadge: {
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catText: { fontSize: 12, color: '#ea580c' },
});
