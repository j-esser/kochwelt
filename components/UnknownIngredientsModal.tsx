import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Modal, Pressable, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BaselineIngredient, IngredientCategory } from '@/constants/ingredientBaseline';
import { makeUserIngredientId } from '@/services/ingredientBaseline';

const CATEGORIES: IngredientCategory[] = [
  'Vorrat', 'Gemüse & Obst', 'Fleisch & Fisch', 'Mopro',
  'Trockensortiment', 'Tiefkühl', 'Sonstiges',
];

const BASE_UNITS: Array<'g' | 'ml' | 'Stück'> = ['g', 'ml', 'Stück'];

export interface UnknownInput {
  rawName: string;
  quantity?: number;
  unit?: string;
}

interface RowState {
  rawName: string;
  name: string;
  category: IngredientCategory;
  base_unit: 'g' | 'ml' | 'Stück';
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
}

interface Props {
  visible: boolean;
  unknowns: UnknownInput[];
  onCancel: () => void;
  onSubmit: (created: BaselineIngredient[]) => void;
}

function inferUnit(unit?: string): 'g' | 'ml' | 'Stück' {
  if (!unit) return 'g';
  const u = unit.toLowerCase();
  if (u === 'ml' || u === 'l') return 'ml';
  if (u === 'stück' || u === 'scheibe' || u === 'zehe') return 'Stück';
  return 'g';
}

function makeInitialRow(u: UnknownInput): RowState {
  return {
    rawName: u.rawName,
    name: u.rawName,
    category: 'Vorrat',
    base_unit: inferUnit(u.unit),
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
  };
}

export function UnknownIngredientsModal({ visible, unknowns, onCancel, onSubmit }: Props) {
  const [rows, setRows] = useState<RowState[]>([]);

  useEffect(() => {
    if (visible) setRows(unknowns.map(makeInitialRow));
  }, [visible, unknowns]);

  function updateRow(idx: number, patch: Partial<RowState>) {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function buildResult(rs: RowState[]): BaselineIngredient[] {
    return rs.map(r => {
      const num = (s: string) => {
        const v = parseFloat(s.replace(',', '.'));
        return isNaN(v) ? 0 : v;
      };
      const nutrients = {
        calories: num(r.calories),
        protein: num(r.protein),
        fat: num(r.fat),
        carbs: num(r.carbs),
      };
      const ing: BaselineIngredient = {
        id: makeUserIngredientId(r.name) || 'u_' + Date.now().toString(36),
        name: r.name.trim() || r.rawName,
        category: r.category,
        base_unit: r.base_unit,
        aliases: r.rawName.toLowerCase().trim() !== r.name.toLowerCase().trim()
          ? [r.rawName.toLowerCase().trim()]
          : undefined,
      };
      if (r.base_unit === 'ml') ing.nutrients_per_100ml = nutrients;
      else ing.nutrients_per_100g = nutrients;
      return ing;
    });
  }

  function handleApply() {
    onSubmit(buildResult(rows));
  }

  function handleZeros() {
    onSubmit(buildResult(rows));
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <Pressable
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
        onPress={onCancel}
      />
      <View style={s.sheet}>
        <View style={s.handle} />
        <Text style={s.title}>Unbekannte Zutaten</Text>
        <Text style={s.intro}>
          Diese Zutaten sind noch nicht in der Baseline. Pflege Name, Kategorie und Nährwerte —
          oder lass die Felder leer („Mit 0 anlegen"). Du kannst sie später bearbeiten.
        </Text>

        <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
          {rows.map((r, idx) => (
            <View key={idx} style={s.row}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Ionicons name="warning-outline" size={14} color="#d97706" />
                <Text style={s.rawName}>"{r.rawName}"</Text>
              </View>

              <Text style={s.label}>Name</Text>
              <TextInput
                style={s.input}
                value={r.name}
                onChangeText={t => updateRow(idx, { name: t })}
                autoCapitalize="words"
              />

              <Text style={s.label}>Kategorie</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => updateRow(idx, { category: cat })}
                    style={[s.chip, r.category === cat && s.chipActive]}
                  >
                    <Text style={[s.chipText, r.category === cat && s.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.label}>Basis-Einheit</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {BASE_UNITS.map(u => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => updateRow(idx, { base_unit: u })}
                    style={[s.unitPill, r.base_unit === u && s.unitPillActive]}
                  >
                    <Text style={[s.chipText, r.base_unit === u && s.chipTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Nährwerte pro 100 {r.base_unit === 'Stück' ? 'g' : r.base_unit}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {([
                  ['kcal', r.calories, (v: string) => updateRow(idx, { calories: v })],
                  ['Eiweiß', r.protein, (v: string) => updateRow(idx, { protein: v })],
                  ['Fett', r.fat, (v: string) => updateRow(idx, { fat: v })],
                  ['KH', r.carbs, (v: string) => updateRow(idx, { carbs: v })],
                ] as const).map(([lbl, val, setVal]) => (
                  <View key={lbl} style={{ flex: 1 }}>
                    <Text style={s.nutrientLabel}>{lbl}</Text>
                    <TextInput
                      style={s.nutrientInput}
                      keyboardType="numeric"
                      value={val}
                      onChangeText={setVal}
                      placeholder="0"
                      placeholderTextColor="#d6d3d1"
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TouchableOpacity onPress={onCancel} style={s.btnSecondary}>
            <Text style={s.btnSecondaryText}>Abbrechen</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleZeros} style={s.btnSecondary}>
            <Text style={s.btnSecondaryText}>Mit 0 anlegen</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleApply} style={s.btnPrimary}>
            <Text style={s.btnPrimaryText}>Übernehmen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    backgroundColor: '#e7e5e4',
    borderRadius: 2,
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1c1917', marginBottom: 4 },
  intro: { fontSize: 12, color: '#78716c', marginBottom: 12, lineHeight: 16 },
  row: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 12,
    marginBottom: 10,
  },
  rawName: { fontSize: 13, fontWeight: '700', color: '#c2410c' },
  label: { fontSize: 11, fontWeight: '600', color: '#78716c', marginBottom: 4, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1c1917',
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    marginRight: 6,
  },
  chipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  chipText: { fontSize: 12, color: '#57534e' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  unitPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    alignItems: 'center',
  },
  unitPillActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  nutrientLabel: { fontSize: 10, color: '#a8a29e', textAlign: 'center', marginBottom: 2 },
  nutrientInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingVertical: 8,
    fontSize: 13,
    color: '#1c1917',
    textAlign: 'center',
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
  },
  btnSecondaryText: { color: '#57534e', fontSize: 13, fontWeight: '600' },
  btnPrimary: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f97316',
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
