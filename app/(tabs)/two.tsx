import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Share, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getWeekPlan, toDateKey, weekStart, addDays, WEEKDAYS,
  type WeekPlan,
} from '../../services/plannerStore';
import { getAllRecipes, type Recipe } from '../../services/recipeStore';
import {
  buildShoppingList, shoppingListToText, shoppingListToICS, CATEGORY_ORDER,
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

const KEY_CHECKED   = 'kochwelt_shopping_checked';
const KEY_SELECTION = 'kochwelt_shopping_selection';
const KEY_OWNED     = 'kochwelt_shopping_owned';

export default function ShoppingScreen() {
  const router = useRouter();
  const [weekPlan, setWeekPlan]         = useState<WeekPlan>({});
  const [recipeMap, setRecipeMap]       = useState<Record<string, Recipe>>({});
  const [plannedDates, setPlannedDates] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [list, setList]       = useState<ShoppingList>({});
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [owned, setOwned]     = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [onlyBuy, setOnlyBuy] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [plan, recipes, savedSelection, savedChecked, savedOwned] = await Promise.all([
        getWeekPlan(),
        getAllRecipes(),
        AsyncStorage.getItem(KEY_SELECTION),
        AsyncStorage.getItem(KEY_CHECKED),
        AsyncStorage.getItem(KEY_OWNED),
      ]);

      const rMap: Record<string, Recipe> = Object.fromEntries(recipes.map(r => [r.id, r]));
      setRecipeMap(rMap);
      setWeekPlan(plan);

      const todayKey = toDateKey(weekStart(new Date()));
      const withMeals = Object.keys(plan)
        .filter(d => d >= todayKey && plan[d] && Object.keys(plan[d]).length > 0)
        .sort();
      setPlannedDates(withMeals);

      let sel: Set<string>;
      if (savedSelection) {
        const saved = new Set<string>(JSON.parse(savedSelection));
        sel = new Set(withMeals.filter(d => saved.has(d)));
        if (sel.size === 0) sel = new Set(withMeals);
      } else {
        sel = new Set(withMeals);
      }
      setSelectedDates(sel);

      const filteredPlan = Object.fromEntries([...sel].map(d => [d, plan[d]]));
      const built = buildShoppingList(filteredPlan, rMap);
      setList(built);

      const allKeys = allItemKeys(built);

      if (savedChecked) {
        setChecked(new Set((JSON.parse(savedChecked) as string[]).filter(k => allKeys.has(k))));
      } else {
        setChecked(new Set());
      }
      if (savedOwned) {
        setOwned(new Set((JSON.parse(savedOwned) as string[]).filter(k => allKeys.has(k))));
      } else {
        setOwned(new Set());
      }
    })();
  }, []));

  function allItemKeys(l: ShoppingList): Set<string> {
    return new Set(
      Object.entries(l).flatMap(([cat, items]) => items.map(i => `${cat}::${i.name}`))
    );
  }

  function applySelection(sel: Set<string>) {
    setSelectedDates(sel);
    AsyncStorage.setItem(KEY_SELECTION, JSON.stringify([...sel]));
    const filteredPlan = Object.fromEntries([...sel].map(d => [d, weekPlan[d]]));
    const built = buildShoppingList(filteredPlan, recipeMap);
    setList(built);
    const allKeys = allItemKeys(built);
    setChecked(prev => {
      const next = new Set([...prev].filter(k => allKeys.has(k)));
      AsyncStorage.setItem(KEY_CHECKED, JSON.stringify([...next]));
      return next;
    });
    setOwned(prev => {
      const next = new Set([...prev].filter(k => allKeys.has(k)));
      AsyncStorage.setItem(KEY_OWNED, JSON.stringify([...next]));
      return next;
    });
  }

  function toggleDate(date: string) {
    const next = new Set(selectedDates);
    next.has(date) ? next.delete(date) : next.add(date);
    applySelection(next);
  }

  function toggleItem(key: string) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      AsyncStorage.setItem(KEY_CHECKED, JSON.stringify([...next]));
      return next;
    });
  }

  function toggleOwned(key: string) {
    setOwned(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      AsyncStorage.setItem(KEY_OWNED, JSON.stringify([...next]));
      return next;
    });
  }

  function checkAll() {
    const buyKeys = new Set(
      Object.entries(list).flatMap(([cat, items]) =>
        items.filter(i => !owned.has(`${cat}::${i.name}`)).map(i => `${cat}::${i.name}`)
      )
    );
    setChecked(buyKeys);
    AsyncStorage.setItem(KEY_CHECKED, JSON.stringify([...buyKeys]));
  }

  function resetChecked() {
    setChecked(new Set());
    AsyncStorage.setItem(KEY_CHECKED, JSON.stringify([]));
  }

  function resetOwned() {
    setOwned(new Set());
    AsyncStorage.setItem(KEY_OWNED, JSON.stringify([]));
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

  async function handleShareICS() {
    if (Platform.OS === 'web') {
      const ics = shoppingListToICS(list);
      const blob = new Blob([ics], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'einkaufsliste.ics'; a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const ics = shoppingListToICS(list);
    const path = FileSystem.documentDirectory + 'einkaufsliste.ics';
    await FileSystem.writeAsStringAsync(path, ics, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(path, { mimeType: 'text/calendar', UTI: 'public.calendar' });
  }

  const categories = CATEGORY_ORDER.filter(c => list[c]?.length);

  // Counts for progress (owned items don't need to be bought)
  const totalToBuy = Object.entries(list).reduce(
    (s, [cat, items]) => s + items.filter(i => !owned.has(`${cat}::${i.name}`)).length, 0
  );
  const checkedToBuy = Object.entries(list).reduce(
    (s, [cat, items]) => s + items.filter(i => !owned.has(`${cat}::${i.name}`) && checked.has(`${cat}::${i.name}`)).length, 0
  );
  const ownedCount = owned.size;
  const totalItems = Object.values(list).reduce((s, arr) => s + arr.length, 0);

  if (plannedDates.length === 0) {
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
          <Text style={s.sub}>
            {onlyBuy
              ? `${checkedToBuy}/${totalToBuy} gekauft${ownedCount > 0 ? ` · ${ownedCount} vorhanden` : ''}`
              : `${checkedToBuy}/${totalToBuy} zu kaufen${ownedCount > 0 ? ` · ${ownedCount} vorhanden` : ''}`
            }
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {totalToBuy > 0 && checkedToBuy < totalToBuy && (
            <TouchableOpacity onPress={checkAll} style={s.iconBtn}>
              <Ionicons name="checkmark-done-outline" size={18} color="#f97316" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleShareICS} style={s.iconBtn}>
            <Ionicons name="alarm-outline" size={18} color="#f97316" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
            <Ionicons name="share-outline" size={18} color="#ffffff" />
            <Text style={s.shareBtnText}>Teilen</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tagesauswahl */}
      <View style={s.daySection}>
        <Text style={s.daySectionLabel}>Tage auswählen</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayRow}>
          {plannedDates.map(date => {
            const d = new Date(date + 'T12:00:00');
            const dayIndex = (d.getDay() + 6) % 7;
            const label = `${WEEKDAYS[dayIndex]} ${d.getDate()}.${d.getMonth() + 1}.`;
            const active = selectedDates.has(date);
            return (
              <TouchableOpacity
                key={date}
                onPress={() => toggleDate(date)}
                style={[s.dayChip, active && s.dayChipActive]}
              >
                <Text style={[s.dayChipText, active && s.dayChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Phase-Toggle */}
      <View style={s.phaseRow}>
        <TouchableOpacity
          style={[s.phaseBtn, !onlyBuy && s.phaseBtnActive]}
          onPress={() => setOnlyBuy(false)}
        >
          <Ionicons name="home-outline" size={14} color={!onlyBuy ? '#ffffff' : '#78716c'} />
          <Text style={[s.phaseBtnText, !onlyBuy && s.phaseBtnTextActive]}>Vorbereitung</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.phaseBtn, onlyBuy && s.phaseBtnActive]}
          onPress={() => setOnlyBuy(true)}
        >
          <Ionicons name="cart-outline" size={14} color={onlyBuy ? '#ffffff' : '#78716c'} />
          <Text style={[s.phaseBtnText, onlyBuy && s.phaseBtnTextActive]}>Einkauf</Text>
        </TouchableOpacity>
        {onlyBuy && ownedCount > 0 && (
          <View style={s.ownedBadge}>
            <Ionicons name="home" size={12} color="#22c55e" />
            <Text style={s.ownedBadgeText}>{ownedCount} ausgeblendet</Text>
          </View>
        )}
      </View>

      {/* Fortschritt */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${totalToBuy > 0 ? (checkedToBuy / totalToBuy) * 100 : 0}%` as any }]} />
      </View>

      {totalItems === 0 ? (
        <View style={s.empty}>
          <Ionicons name="calendar-outline" size={48} color="#d6d3d1" />
          <Text style={s.emptyTitle}>Keine Tage ausgewählt</Text>
          <Text style={s.emptyText}>Wähle oben mindestens einen Tag aus.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {categories.map(cat => {
            const allItems: ShoppingItem[] = list[cat] ?? [];
            const items = onlyBuy
              ? allItems.filter(i => !owned.has(`${cat}::${i.name}`))
              : allItems;
            if (items.length === 0) return null;

            const isCollapsed = collapsed.has(cat);
            const doneInCat = items.filter(i => checked.has(`${cat}::${i.name}`) && !owned.has(`${cat}::${i.name}`)).length;
            const ownedInCat = onlyBuy ? 0 : allItems.filter(i => owned.has(`${cat}::${i.name}`)).length;
            const toBuyInCat = items.filter(i => !owned.has(`${cat}::${i.name}`)).length;

            return (
              <View key={cat} style={s.catSection}>
                <TouchableOpacity style={s.catHeader} onPress={() => toggleCollapse(cat)}>
                  <Ionicons name={(CAT_ICONS[cat] ?? 'bag-outline') as any} size={18} color="#78716c" />
                  <Text style={s.catName}>{cat}</Text>
                  {ownedInCat > 0 && (
                    <View style={s.catOwnedBadge}>
                      <Ionicons name="home" size={10} color="#22c55e" />
                      <Text style={s.catOwnedText}>{ownedInCat}</Text>
                    </View>
                  )}
                  <Text style={s.catCount}>{doneInCat}/{toBuyInCat}</Text>
                  <Ionicons name={isCollapsed ? 'chevron-forward' : 'chevron-down'} size={16} color="#a8a29e" />
                </TouchableOpacity>

                {!isCollapsed && items.map(item => {
                  const key = `${cat}::${item.name}`;
                  const done = checked.has(key);
                  const isOwned = owned.has(key);

                  return (
                    <View key={key} style={[s.itemRow, isOwned && s.itemRowOwned]}>
                      {/* Checkbox (nur wenn nicht vorhanden) */}
                      <TouchableOpacity
                        style={s.itemCheck}
                        onPress={() => !isOwned && toggleItem(key)}
                        activeOpacity={isOwned ? 1 : 0.7}
                      >
                        {isOwned ? (
                          <View style={s.checkboxOwned}>
                            <Ionicons name="home" size={12} color="#22c55e" />
                          </View>
                        ) : (
                          <View style={[s.checkbox, done && s.checkboxDone]}>
                            {done && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Name & Menge */}
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          s.itemName,
                          done && !isOwned && s.itemNameDone,
                          isOwned && s.itemNameOwned,
                        ]}>
                          {item.name}
                        </Text>
                        {item.combined ? (
                          <Text style={[s.itemAmount, (done || isOwned) && s.itemAmountDone]}>
                            {item.combined}
                          </Text>
                        ) : null}
                      </View>

                      {/* Vorhanden-Toggle */}
                      <TouchableOpacity
                        onPress={() => toggleOwned(key)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={s.ownedBtn}
                      >
                        <Ionicons
                          name={isOwned ? 'home' : 'home-outline'}
                          size={18}
                          color={isOwned ? '#22c55e' : '#d6d3d1'}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            );
          })}

          <View style={s.resetRow}>
            {checkedToBuy > 0 && (
              <TouchableOpacity style={s.resetBtn} onPress={resetChecked}>
                <Ionicons name="refresh-outline" size={15} color="#78716c" />
                <Text style={s.resetBtnText}>Einkauf zurücksetzen</Text>
              </TouchableOpacity>
            )}
            {ownedCount > 0 && (
              <TouchableOpacity style={s.resetBtn} onPress={resetOwned}>
                <Ionicons name="home-outline" size={15} color="#78716c" />
                <Text style={s.resetBtnText}>Vorbereitung zurücksetzen</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f4' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  heading: { fontSize: 24, fontWeight: '800', color: '#1c1917' },
  sub: { fontSize: 13, color: '#a8a29e', marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', alignItems: 'center', justifyContent: 'center' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f97316', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  shareBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },

  daySection: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 2 },
  daySectionLabel: { fontSize: 11, fontWeight: '600', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  dayRow: { gap: 8, paddingBottom: 4 },
  dayChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e7e5e4' },
  dayChipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  dayChipText: { fontSize: 13, fontWeight: '600', color: '#78716c' },
  dayChipTextActive: { color: '#ffffff' },

  // Phase toggle
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10 },
  phaseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e7e5e4' },
  phaseBtnActive: { backgroundColor: '#1c1917', borderColor: '#1c1917' },
  phaseBtnText: { fontSize: 13, fontWeight: '600', color: '#78716c' },
  phaseBtnTextActive: { color: '#ffffff' },
  ownedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' as any },
  ownedBadgeText: { fontSize: 12, color: '#22c55e', fontWeight: '600' },

  progressBar: { height: 4, backgroundColor: '#e7e5e4', marginHorizontal: 20, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#f97316', borderRadius: 2 },

  catSection: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  catName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1c1917' },
  catCount: { fontSize: 12, color: '#a8a29e', marginRight: 4 },
  catOwnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4 },
  catOwnedText: { fontSize: 11, fontWeight: '600', color: '#22c55e' },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#f5f5f4' },
  itemRowOwned: { backgroundColor: '#f0fdf4' },
  itemCheck: { },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#d6d3d1', alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: '#f97316', borderColor: '#f97316' },
  checkboxOwned: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#86efac', backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 15, color: '#1c1917', fontWeight: '500' },
  itemNameDone: { color: '#d6d3d1', textDecorationLine: 'line-through' },
  itemNameOwned: { color: '#16a34a', fontWeight: '500' },
  itemAmount: { fontSize: 12, color: '#78716c', marginTop: 1 },
  itemAmountDone: { color: '#d6d3d1' },
  ownedBtn: { paddingLeft: 4 },

  resetRow: { gap: 8 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14 },
  resetBtnText: { fontSize: 14, color: '#78716c' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1c1917', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#78716c', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  emptyBtn: { marginTop: 20, backgroundColor: '#f97316', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
});
