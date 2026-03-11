import { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { saveRecipe, createId, type Recipe, type Ingredient } from '../services/recipeStore';

const RECIPE_TABS = [
  'Pasta', 'Reis', 'Curry', 'Suppe', 'Fisch', 'Fleisch', 'Vegetarisch', 'Salat', 'Eintopf',
];

const SHOP_CATEGORIES = [
  'Gemüse & Obst', 'Trockensortiment', 'Tiefkühl', 'Mopro',
  'Fleisch & Fisch', 'Vorrat', 'Sonstiges',
];

// Simple classifier (ported from web-app)
const DICT: Record<string, string[]> = {
  'Gemüse & Obst': ['möhr','karott','zwiebel','knoblauch','tomate','paprika','zucchini','aubergine','spinat','brokkoli','lauch','sellerie','gurke','kohl','fenchel','pilz','champignon','ingwer','chili','petersilie','basilikum'],
  'Trockensortiment': ['spaghetti','penne','nudel','pasta','reis','linsen','kichererbsen','mehl','brühe','kokosmilch','tomatenmark','nüsse','mandeln'],
  'Mopro': ['milch','sahne','butter','käse','parmesan','mozzarella','joghurt','quark','ei','eier','frischkäse','ricotta'],
  'Fleisch & Fisch': ['hähnchen','hühnchen','rind','schwein','lamm','speck','schinken','hackfleisch','lachs','garnelen','fisch','thunfisch'],
  'Tiefkühl': ['tiefkühl','tk-',' tk '],
  'Vorrat': ['salz','pfeffer','öl','olivenöl','essig','gewürz','curry','kurkuma','paprikapulver','zimt','oregano','thymian','rosmarin','senf','honig'],
};

function classifyIngredient(name: string): string {
  const lower = name.toLowerCase();
  let best = 'Sonstiges', bestLen = 0;
  for (const [cat, words] of Object.entries(DICT)) {
    for (const w of words) {
      if (lower.includes(w) && w.length > bestLen) { best = cat; bestLen = w.length; }
    }
  }
  return best;
}

interface Props {
  initial?: Recipe;
  title: string;
}

export default function RecipeForm({ initial, title }: Props) {
  const router = useRouter();

  const [recipeTitle, setRecipeTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [cookTime, setCookTime] = useState(String(initial?.cookTime ?? 40));
  const [portions, setPortions] = useState(String(initial?.portions ?? 2));
  const [reference, setReference] = useState(initial?.reference ?? '');
  const [selectedCats, setSelectedCats] = useState<string[]>(initial?.categories ?? []);
  const [kcal, setKcal] = useState(initial?.nutrition?.kcal != null ? String(initial.nutrition.kcal) : '');
  const [protein, setProtein] = useState(initial?.nutrition?.protein != null ? String(initial.nutrition.protein) : '');
  const [fat, setFat] = useState(initial?.nutrition?.fat != null ? String(initial.nutrition.fat) : '');
  const [carbs, setCarbs] = useState(initial?.nutrition?.carbs != null ? String(initial.nutrition.carbs) : '');
  const [ingredientsText, setIngredientsText] = useState(
    initial?.ingredients.map(i => `${i.amount} ${i.name}`.trim()).join('\n') ?? ''
  );

  function toggleCat(cat: string) {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  function parseIngredients(text: string): Ingredient[] {
    return text.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const m = line.match(/^([\d.,½¼¾⅓⅔]+\s*(?:g|kg|ml|l|EL|TL|Esslöffel|Teelöffel|Prise|Bund|Dose|Stück|Scheibe|Zehe|Tasse|Packung|Päckchen)?)\s+(.+)$/i);
        if (m) return { amount: m[1].trim(), name: m[2].trim(), shopCategory: classifyIngredient(m[2]) };
        return { amount: '', name: line, shopCategory: classifyIngredient(line) };
      });
  }

  async function handleSave() {
    if (!recipeTitle.trim()) {
      Alert.alert('Titel fehlt', 'Bitte einen Titel eingeben.');
      return;
    }
    const recipe: Recipe = {
      id: initial?.id ?? createId(),
      title: recipeTitle.trim(),
      categories: selectedCats,
      description: description.trim(),
      cookTime: parseInt(cookTime) || 40,
      portions: parseInt(portions) || 2,
      reference: reference.trim(),
      ingredients: parseIngredients(ingredientsText),
      nutrition: {
        kcal: kcal ? parseInt(kcal) : null,
        protein: protein ? parseInt(protein) : null,
        fat: fat ? parseInt(fat) : null,
        carbs: carbs ? parseInt(carbs) : null,
      },
    };
    await saveRecipe(recipe);
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{ title, headerRight: () => (
        <TouchableOpacity onPress={handleSave}>
          <Text className="text-orange-500 font-semibold text-base">Speichern</Text>
        </TouchableOpacity>
      )}} />
      <ScrollView className="flex-1 bg-stone-50" contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

        {/* Titel */}
        <Text className="text-stone-500 text-xs font-medium mb-1 uppercase tracking-wide">Titel</Text>
        <TextInput
          className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 mb-4"
          placeholder="Rezepttitel"
          value={recipeTitle}
          onChangeText={setRecipeTitle}
        />

        {/* Kategorien */}
        <Text className="text-stone-500 text-xs font-medium mb-2 uppercase tracking-wide">Kategorien</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {RECIPE_TABS.map(cat => {
            const active = selectedCats.includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => toggleCat(cat)}
                className={`px-3 py-1.5 rounded-full border ${active ? 'bg-orange-500 border-orange-500' : 'bg-white border-stone-200'}`}
              >
                <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-stone-600'}`}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Kochzeit + Portionen */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-stone-500 text-xs font-medium mb-1 uppercase tracking-wide">Kochzeit (min)</Text>
            <TextInput
              className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800"
              keyboardType="numeric"
              value={cookTime}
              onChangeText={setCookTime}
            />
          </View>
          <View className="flex-1">
            <Text className="text-stone-500 text-xs font-medium mb-1 uppercase tracking-wide">Portionen</Text>
            <TextInput
              className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800"
              keyboardType="numeric"
              value={portions}
              onChangeText={setPortions}
            />
          </View>
        </View>

        {/* Nährwerte */}
        <Text className="text-stone-500 text-xs font-medium mb-2 uppercase tracking-wide">Nährwerte pro Portion</Text>
        <View className="flex-row gap-3 mb-4">
          {[
            { label: 'kcal', value: kcal, set: setKcal },
            { label: 'Eiweiß g', value: protein, set: setProtein },
            { label: 'Fett g', value: fat, set: setFat },
            { label: 'KH g', value: carbs, set: setCarbs },
          ].map(({ label, value, set }) => (
            <View key={label} className="flex-1">
              <Text className="text-stone-400 text-xs mb-1 text-center">{label}</Text>
              <TextInput
                className="bg-white border border-stone-200 rounded-xl px-2 py-3 text-stone-800 text-center"
                keyboardType="numeric"
                value={value}
                onChangeText={set}
                placeholder="—"
                placeholderTextColor="#d6d3d1"
              />
            </View>
          ))}
        </View>

        {/* Zutaten */}
        <Text className="text-stone-500 text-xs font-medium mb-1 uppercase tracking-wide">
          Zutaten (eine pro Zeile, z.B. „400 g Nudeln")
        </Text>
        <TextInput
          className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 mb-4"
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          value={ingredientsText}
          onChangeText={setIngredientsText}
          placeholder={"400 g Spaghetti\n150 g Speck\n4 Eier"}
          placeholderTextColor="#a8a29e"
        />

        {/* Zubereitung */}
        <Text className="text-stone-500 text-xs font-medium mb-1 uppercase tracking-wide">Zubereitung</Text>
        <TextInput
          className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 mb-4"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
          placeholder="Zubereitung beschreiben…"
          placeholderTextColor="#a8a29e"
        />

        {/* Referenz */}
        <Text className="text-stone-500 text-xs font-medium mb-1 uppercase tracking-wide">Quelle / URL</Text>
        <TextInput
          className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 mb-4"
          placeholder="https://... oder Kochbuch"
          value={reference}
          onChangeText={setReference}
          autoCapitalize="none"
        />

        <TouchableOpacity
          className="bg-orange-500 rounded-xl py-4 items-center mt-2"
          onPress={handleSave}
        >
          <Text className="text-white font-semibold text-base">Rezept speichern</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}
