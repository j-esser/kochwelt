import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getUnreadGifts, markGiftRead, type GiftEntry } from '../services/giftRecipes';

/**
 * Banner für die Rezepte-Liste: zeigt das nächste ungelesene Geschenk-Rezept an.
 * - Tap auf den Banner-Body → Detail öffnen + als gelesen markieren
 * - Tap auf X → nur als gelesen markieren (kein Navigieren)
 * Bei mehreren ungelesenen wird das erste im Cache angezeigt; Banner schließt
 * sich automatisch, wenn alle gelesen sind.
 */
export function GiftBanner() {
  const router = useRouter();
  const [queue, setQueue] = useState<GiftEntry[]>([]);

  const reload = useCallback(async () => {
    setQueue(await getUnreadGifts());
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  if (queue.length === 0) return null;

  const next = queue[0];
  const moreCount = queue.length - 1;

  async function handleOpen() {
    await markGiftRead(next.id);
    setQueue(q => q.slice(1));
    router.push({ pathname: '/recipe/[id]', params: { id: next.recipe.id } });
  }

  async function handleDismiss() {
    await markGiftRead(next.id);
    setQueue(q => q.slice(1));
  }

  return (
    <View style={s.banner}>
      <TouchableOpacity style={s.body} onPress={handleOpen} activeOpacity={0.7}>
        <View style={s.iconWrap}>
          <Ionicons name="gift-outline" size={20} color="#f97316" />
        </View>
        <View style={s.textWrap}>
          <Text style={s.label}>
            🎁 Neues Geschenk-Rezept{moreCount > 0 ? ` (+${moreCount} weitere)` : ''}
          </Text>
          <Text style={s.title} numberOfLines={1}>{next.recipe.title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#f97316" />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDismiss} style={s.close} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Ionicons name="close" size={16} color="#9a3412" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffedd5',
    alignItems: 'center', justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label: { fontSize: 11, fontWeight: '600', color: '#9a3412', letterSpacing: 0.3, textTransform: 'uppercase' },
  title: { fontSize: 15, fontWeight: '700', color: '#1c1917', marginTop: 1 },
  close: { padding: 4, marginLeft: 4 },
});
