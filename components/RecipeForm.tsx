import { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
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

// ─── ISO 8601 duration → minutes ──────────────────────────────────────────────
function parseDuration(d: string): number {
  if (!d) return 40;
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return 40;
  return (parseInt(m[1] ?? '0') * 60) + parseInt(m[2] ?? '0');
}

// ─── JSON-LD Recipe extractor ─────────────────────────────────────────────────
function extractFromJsonLd(data: any): Partial<{
  title: string; description: string; cookTime: number; portions: number;
  ingredientsText: string; reference: string; kcal: string;
  categories: string[];
}> {
  const instructions = Array.isArray(data.recipeInstructions)
    ? data.recipeInstructions
        .map((s: any) => typeof s === 'string' ? s : (s.text ?? '')).join('\n\n')
    : (data.recipeInstructions ?? '');

  const ingredientsRaw: string[] = Array.isArray(data.recipeIngredient)
    ? data.recipeIngredient : [];

  const portionsRaw = data.recipeYield;
  const portions = typeof portionsRaw === 'number'
    ? portionsRaw
    : parseInt(Array.isArray(portionsRaw) ? portionsRaw[0] : String(portionsRaw ?? '2'));

  const cookTimeRaw = data.cookTime ?? data.totalTime ?? '';
  const cookTime = typeof cookTimeRaw === 'number'
    ? cookTimeRaw : parseDuration(String(cookTimeRaw));

  const kcal = data.nutrition?.calories
    ? String(parseInt(data.nutrition.calories)) : '';

  return {
    title: data.name ?? '',
    description: instructions,
    cookTime: isNaN(cookTime) ? 40 : cookTime,
    portions: isNaN(portions) ? 2 : portions,
    ingredientsText: ingredientsRaw.join('\n'),
    reference: data.url ?? data['@id'] ?? '',
    kcal,
    categories: [],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

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

  // Import state
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [importing, setImporting] = useState(false);

  function applyImport(data: Partial<{
    title: string; description: string; cookTime: number; portions: number;
    ingredientsText: string; reference: string; kcal: string; categories: string[];
  }>) {
    if (data.title) setRecipeTitle(data.title);
    if (data.description) setDescription(data.description);
    if (data.cookTime) setCookTime(String(data.cookTime));
    if (data.portions) setPortions(String(data.portions));
    if (data.ingredientsText) setIngredientsText(data.ingredientsText);
    if (data.reference) setReference(data.reference);
    if (data.kcal) setKcal(data.kcal);
    if (data.categories?.length) setSelectedCats(data.categories);
  }

  async function handleUrlImport() {
    if (!urlInput.trim()) return;
    setImporting(true);
    try {
      const res = await fetch(urlInput.trim());
      const html = await res.text();

      // Find all JSON-LD blocks
      const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      let found = false;
      while ((match = regex.exec(html)) !== null) {
        try {
          const parsed = JSON.parse(match[1]);
          const candidates = [parsed, ...(parsed['@graph'] ?? [])];
          for (const item of candidates) {
            if (item?.['@type'] === 'Recipe' || item?.['@type']?.includes?.('Recipe')) {
              applyImport(extractFromJsonLd(item));
              found = true;
              break;
            }
          }
          if (found) break;
        } catch { /* skip malformed JSON-LD blocks */ }
      }

      if (!found) {
        Alert.alert('Kein Rezept gefunden', 'Diese Seite enthält keine strukturierten Rezeptdaten (JSON-LD). Versuche eine andere URL.');
      } else {
        setShowUrlInput(false);
        setUrlInput('');
      }
    } catch (e) {
      Alert.alert('Fehler', 'URL konnte nicht geladen werden. Bitte Internetverbindung prüfen.');
    } finally {
      setImporting(false);
    }
  }

  async function handleJsonImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const text = await fetch(uri).then(r => r.text());
      const data = JSON.parse(text);

      // Support single recipe or array (export from web-app)
      const recipe: any = Array.isArray(data) ? data[0] : data;
      if (!recipe?.title) {
        Alert.alert('Ungültiges Format', 'Die JSON-Datei enthält kein erkennbares Rezept.');
        return;
      }

      applyImport({
        title: recipe.title,
        description: recipe.description,
        cookTime: recipe.cookTime,
        portions: recipe.portions,
        ingredientsText: recipe.ingredients
          ?.map((i: any) => `${i.amount ?? ''} ${i.name ?? ''}`.trim()).join('\n') ?? '',
        reference: recipe.reference,
        kcal: recipe.nutrition?.kcal != null ? String(recipe.nutrition.kcal) : '',
        categories: recipe.categories ?? [],
      });
    } catch (e) {
      Alert.alert('Fehler', 'JSON-Datei konnte nicht gelesen werden.');
    }
  }

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

        {/* Import-Bereich (nur bei neuem Rezept) */}
        {!initial && (
          <View style={{ backgroundColor: '#fff7ed', borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#fed7aa' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#c2410c', marginBottom: 10 }}>
              Rezept importieren
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 10 }}
                onPress={() => setShowUrlInput(v => !v)}
              >
                <Ionicons name="link-outline" size={15} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Von URL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#fed7aa' }}
                onPress={handleJsonImport}
              >
                <Ionicons name="document-outline" size={15} color="#f97316" />
                <Text style={{ color: '#f97316', fontWeight: '600', fontSize: 13 }}>JSON-Datei</Text>
              </TouchableOpacity>
            </View>

            {showUrlInput && (
              <View style={{ marginTop: 10 }}>
                <TextInput
                  style={{ backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#fed7aa', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1c1917' }}
                  placeholder="https://www.chefkoch.de/rezepte/..."
                  placeholderTextColor="#a8a29e"
                  value={urlInput}
                  onChangeText={setUrlInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <TouchableOpacity
                  style={{ marginTop: 8, backgroundColor: importing ? '#fed7aa' : '#f97316', borderRadius: 10, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                  onPress={handleUrlImport}
                  disabled={importing}
                >
                  {importing
                    ? <ActivityIndicator size="small" color="#f97316" />
                    : <Ionicons name="cloud-download-outline" size={15} color="#fff" />
                  }
                  <Text style={{ color: importing ? '#f97316' : '#fff', fontWeight: '600', fontSize: 13 }}>
                    {importing ? 'Lade...' : 'Importieren'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

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
        <Text className="text-stone-500 text-xs font-medium mb-2 uppercase tracking-wide">Nährwerte (gesamt für alle Portionen)</Text>
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
