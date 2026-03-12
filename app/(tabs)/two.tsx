import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getWeekPlan } from '../../services/plannerStore';
import { getAllRecipes, type Recipe } from '../../services/recipeStore';
import {
  buildShoppingList, shoppingListToText, CATEGORY_ORDER,
  type ShoppingList, type ShoppingItem,
} from '../../services/shoppingList';

const CAT_ICONS: Record<string, string> = {
  'Gemüse & Obst': 'leaf-outline',
  'Fleisch & Fisch': 'fish-outline',
  'Mopro': 'egg-outline',
  'Trockensortiment': 'layers-outline',
  'Tiefkühl': 'snow-outline',
  'Vorrat': 'archive-outline',
  'Sonstiges': 'bag-outline',
};

export default function ShoppingScreen() {
  const router = useRouter();
  const [list, setList] = useState<ShoppingList>({});
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hasData, setHasData] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [weekPlan, recipes] = await Promise.all([getWeekPlan(), getAllRecipes()]);
      const recipeMap: Record<string, Recipe> = Object.fromEntries(recipes.map(r => [r.id, r]));
      const built = buildShoppingList(weekPlan, recipeMap);
      setList(built);
      setHasData(Object.values(weekPlan).some(d => Object.keys(d).length > 0));
      setChecked(new Set());
    })();
  }, []));

  const totalItems = Object.values(list).reduce((s, arr) => s + arr.length, 0);
  const checkedCount = checked.size;

  function toggleItem(key: string) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleCollapse(cat: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  async function handleShare() {
    const text = shoppingListToText(list);
    await Share.share({ message: text, title: 'Einkaufsliste' });
  }

  const categories = CATEGORY_ORDER.filter(c => list[c]?.length);

  if (!hasData) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.topBar}>
          <Text style={s.heading}>Einkaufsliste</Text>
        </View>
        <View style={s.empty}>
          <Ionicons name="cart-outline" size={56} color="#d6d3d1" />
          <Text style={s.emptyTitle}>Noch nichts geplant</Text>
          <Text style={s.emptyText}>Füge im Wochenplaner Rezepte hinzu — die Einkaufsliste wird automatisch erstellt.</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(tabs)/planer')}>
            <Text style={s.emptyBtnText}>Zum Planer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header */}
      <View style={s.topBar}>
        <View>
          <Text style={s.heading}>Einkaufsliste</Text>
          <Text style={s.sub}>{checkedCount}/{totalItems} erledigt</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
          <Ionicons name="share-outline" size={18} color="#ffffff" />
          <Text style={s.shareBtnText}>Teilen</Text>
        </TouchableOpacity>
      </View>

      {/* Fortschritt-Balken */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` as any }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {categories.map(cat => {
          const items: ShoppingItem[] = list[cat] ?? [];
          const isCollapsed = collapsed.has(cat);
          const doneInCat = items.filter(i => checked.has(`${cat}::${i.name}`)).length;

          return (
            <View key={cat} style={s.catSection}>
              <TouchableOpacity style={s.catHeader} onPress={() => toggleCollapse(cat)}>
                <Ionicons name={(CAT_ICONS[cat] ?? 'bag-outline') as any} size={18} color="#78716c" />
                <Text style={s.catName}>{cat}</Text>
                <Text style={s.catCount}>{doneInCat}/{items.length}</Text>
                <Ionicons name={isCollapsed ? 'chevron-forward' : 'chevron-down'} size={16} color="#a8a29e" />
              </TouchableOpacity>

              {!isCollapsed && items.map(item => {
                const key = `${cat}::${item.name}`;
                const done = checked.has(key);
                return (
                  <TouchableOpacity key={key} style={s.itemRow} onPress={() => toggleItem(key)} activeOpacity={0.7}>
                    <View style={[s.checkbox, done && s.checkboxDone]}>
                      {done && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.itemName, done && s.itemNameDone]}>{item.name}</Text>
                      {item.combined ? (
                        <Text style={s.itemAmount}>{item.combined}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {checkedCount > 0 && (
          <TouchableOpacity style={s.clearBtn} onPress={() => setChecked(new Set())}>
            <Ionicons name="refresh-outline" size={15} color="#78716c" />
            <Text style={s.clearBtnText}>Auswahl zurücksetzen</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f4' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  heading: { fontSize: 24, fontWeight: '800', color: '#1c1917' },
  sub: { fontSize: 13, color: '#a8a29e', marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f97316', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  shareBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },

  progressBar: { height: 4, backgroundColor: '#e7e5e4', marginHorizontal: 20, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#f97316', borderRadius: 2 },

  catSection: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },

  catName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1c1917' },
  catCount: { fontSize: 12, color: '#a8a29e', marginRight: 4 },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#f5f5f4' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#d6d3d1', alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: '#f97316', borderColor: '#f97316' },
  itemName: { fontSize: 15, color: '#1c1917', fontWeight: '500' },
  itemNameDone: { color: '#a8a29e', textDecorationLine: 'line-through' },
  itemAmount: { fontSize: 12, color: '#78716c', marginTop: 1 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1c1917', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#78716c', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  emptyBtn: { marginTop: 20, backgroundColor: '#f97316', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },

  clearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14 },
  clearBtnText: { fontSize: 14, color: '#78716c' },
});
