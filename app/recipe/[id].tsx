import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRecipeById, deleteRecipe, type Recipe } from '../../services/recipeStore';

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

  useEffect(() => {
    getRecipeById(id).then(r => { setRecipe(r); setLoading(false); });
  }, [id]);

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

      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 48 }}>
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
});
