import { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import {
  getAllRecipes, seedIfEmpty, RECIPE_TABS,
  type Recipe,
} from '../../services/recipeStore';

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl mx-4 mb-3 p-4 shadow-sm border border-stone-100 active:opacity-70"
    >
      <Text className="text-stone-800 font-semibold text-base" numberOfLines={2}>
        {recipe.title}
      </Text>
      <View className="flex-row items-center gap-3 mt-2">
        <Text className="text-stone-400 text-xs">⏱ {recipe.cookTime} min</Text>
        <Text className="text-stone-400 text-xs">👤 {recipe.portions} Port.</Text>
        {recipe.nutrition?.kcal != null && (
          <Text className="text-orange-500 text-xs font-medium">{recipe.nutrition.kcal} kcal</Text>
        )}
        {recipe.categories.length > 0 && (
          <Text className="text-stone-400 text-xs flex-1" numberOfLines={1}>
            {recipe.categories.join(' · ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

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
      <SafeAreaView className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
        <Text className="text-stone-400 mt-3">Rezepte werden geladen…</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Meine Rezepte',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/recipe/new')}>
              <Text className="text-orange-500 font-semibold text-2xl leading-none">+</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-stone-50" edges={['bottom']}>
        <View className="px-4 pt-3 pb-2">
          <TextInput
            className="bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800"
            placeholder="Rezepte suchen…"
            placeholderTextColor="#a8a29e"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={RECIPE_TABS}
          keyExtractor={t => t}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
          renderItem={({ item: tab }) => {
            const active = tab === activeTab;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full mr-2 ${active ? 'bg-orange-500' : 'bg-white border border-stone-200'}`}
              >
                <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-stone-600'}`}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <FlatList
          data={filtered}
          keyExtractor={r => r.id}
          renderItem={({ item }) => (
            <RecipeCard recipe={item} onPress={() => router.push(`/recipe/${item.id}`)} />
          )}
          ListEmptyComponent={
            <View className="items-center mt-16">
              <Text className="text-stone-400 text-base">Keine Rezepte gefunden</Text>
            </View>
          }
          ListHeaderComponent={
            <Text className="text-stone-400 text-xs px-5 pb-2 pt-1">
              {filtered.length} Rezept{filtered.length !== 1 ? 'e' : ''}
            </Text>
          }
        />
      </SafeAreaView>
    </>
  );
}
