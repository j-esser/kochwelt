import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Tip } from '../services/tips';

interface Props {
  visible: boolean;
  title: string;
  tips: Tip[];
  onClose: () => void;
}

export function TipModal({ visible, title, tips, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)' }]}
        onPress={onClose}
      />
      <View style={s.sheet}>
        <View style={s.handle} />
        <View style={s.header}>
          <Text style={s.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color="#57534e" />
          </TouchableOpacity>
        </View>

        {tips.length === 0 ? (
          <Text style={s.empty}>Hier gibt es noch keine Tipps.</Text>
        ) : (
          <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ paddingBottom: 8 }}>
            {tips.map(tip => (
              <View key={tip.id} style={s.tipCard}>
                <View style={s.tipIconWrap}>
                  <Ionicons name={tip.icon as any} size={20} color="#f97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tipTitle}>{tip.title}</Text>
                  <Text style={s.tipBody}>{tip.body}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
    maxHeight: '85%',
  },
  handle: { width: 40, height: 4, backgroundColor: '#e7e5e4', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#1c1917' },
  empty: { fontSize: 13, color: '#a8a29e', textAlign: 'center', paddingVertical: 24 },

  tipCard: {
    flexDirection: 'row', gap: 12,
    padding: 14,
    backgroundColor: '#fff7ed',
    borderRadius: 14,
    borderWidth: 1, borderColor: '#fed7aa',
    marginBottom: 10,
  },
  tipIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#1c1917' },
  tipBody: { fontSize: 13, color: '#57534e', marginTop: 4, lineHeight: 18 },
});
