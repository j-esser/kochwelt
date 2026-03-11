import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getRecipeById, deleteRecipe, type Recipe } from '../../services/recipeStore';

const SHOP_ICONS: Record<string, string> = {
  'Gemüse & Obst': '🥦',
  'Trockensortiment': '🌾',
  'Tiefkühl': '❄️',
  'Mopro': '🧀',
  'Fleisch & Fisch': '🥩',
  'Vorrat': '🫙',
  'Sonstiges': '🛍️',
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecipeById(id).then(r => { setRecipe(r); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50 items-center justify-center">
        <Text className="text-stone-500">Rezept nicht gefunden</Text>
      </SafeAreaView>
    );
  }

  const hasNutrition = recipe.nutrition &&
    (recipe.nutrition.kcal != null || recipe.nutrition.protein != null);

  function confirmDelete() {
    Alert.alert(
      'Rezept löschen',
      `„${recipe!.title}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen', style: 'destructive',
          onPress: async () => {
            await deleteRecipe(recipe!.id);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <View className="flex-row gap-4">
              <TouchableOpacity onPress={() => router.push(`/recipe/edit/${recipe.id}`)}>
                <Text className="text-orange-500 font-medium">Bearbeiten</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete}>
                <Text className="text-red-500 font-medium">Löschen</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-stone-50" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="bg-white px-5 py-5 border-b border-stone-100">
          <Text className="text-2xl font-bold text-stone-800 leading-tight">{recipe.title}</Text>

          {/* Meta */}
          <View className="flex-row flex-wrap gap-3 mt-3">
            <View className="bg-stone-100 rounded-full px-3 py-1">
              <Text className="text-stone-600 text-sm">⏱ {recipe.cookTime} min</Text>
            </View>
            <View className="bg-stone-100 rounded-full px-3 py-1">
              <Text className="text-stone-600 text-sm">👤 {recipe.portions} Port.</Text>
            </View>
            {recipe.categories.map(cat => (
              <View key={cat} className="bg-orange-100 rounded-full px-3 py-1">
                <Text className="text-orange-700 text-sm">{cat}</Text>
              </View>
            ))}
          </View>

          {/* Nährwerte */}
          {hasNutrition && (
            <View className="flex-row flex-wrap gap-4 mt-4 p-3 bg-orange-50 rounded-xl">
              {recipe.nutrition.kcal != null && (
                <View className="items-center">
                  <Text className="text-orange-600 font-bold text-lg">{recipe.nutrition.kcal}</Text>
                  <Text className="text-stone-500 text-xs">kcal</Text>
                </View>
              )}
              {recipe.nutrition.protein != null && (
                <View className="items-center">
                  <Text className="text-stone-700 font-semibold text-lg">{recipe.nutrition.protein}g</Text>
                  <Text className="text-stone-500 text-xs">Eiweiß</Text>
                </View>
              )}
              {recipe.nutrition.fat != null && (
                <View className="items-center">
                  <Text className="text-stone-700 font-semibold text-lg">{recipe.nutrition.fat}g</Text>
                  <Text className="text-stone-500 text-xs">Fett</Text>
                </View>
              )}
              {recipe.nutrition.carbs != null && (
                <View className="items-center">
                  <Text className="text-stone-700 font-semibold text-lg">{recipe.nutrition.carbs}g</Text>
                  <Text className="text-stone-500 text-xs">Kohlenhydrate</Text>
                </View>
              )}
            </View>
          )}

          {/* Quelle */}
          {recipe.reference ? (
            recipe.reference.startsWith('http') ? (
              <TouchableOpacity
                className="mt-3 flex-row items-center gap-1"
                onPress={() => Linking.openURL(recipe.reference)}
              >
                <Text className="text-orange-500">📖 Quelle öffnen</Text>
              </TouchableOpacity>
            ) : (
              <Text className="mt-3 text-stone-500 text-sm">📖 {recipe.reference}</Text>
            )
          ) : null}
        </View>

        {/* Zutaten */}
        <View className="px-5 pt-5">
          <Text className="text-lg font-bold text-stone-800 mb-3">
            Zutaten ({recipe.portions} Portionen)
          </Text>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} className="flex-row items-start py-2 border-b border-stone-100">
              <Text className="text-base mr-2">{SHOP_ICONS[ing.shopCategory] ?? '•'}</Text>
              <Text className="text-stone-500 w-24 text-sm pt-0.5">{ing.amount}</Text>
              <Text className="text-stone-800 flex-1 text-sm">{ing.name}</Text>
            </View>
          ))}
        </View>

        {/* Zubereitung */}
        {recipe.description ? (
          <View className="px-5 pt-6">
            <Text className="text-lg font-bold text-stone-800 mb-3">Zubereitung</Text>
            <Text className="text-stone-700 leading-6">{recipe.description}</Text>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}
