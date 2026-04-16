import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { exportRecipesJSON, importRecipesJSON } from '../services/recipeStore';

// EncodingType.UTF8 = 'utf8' — direkt als String, da der Enum auf Web undefined ist
const UTF8 = 'utf8' as const;

// ─── Web helpers ──────────────────────────────────────────────────────────────

function webDownload(json: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kochwelt-rezepte.json';
  a.click();
  URL.revokeObjectURL(url);
}

function webPickFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('Abgebrochen')); return; }
      const text = await file.text();
      resolve(text);
    };
    input.oncancel = () => reject(new Error('Abgebrochen'));
    input.click();
  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ToolsScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  function addLog(msg: string) {
    setLog(prev => [...prev, msg]);
  }

  async function handleExport() {
    setBusy(true);
    try {
      const json = await exportRecipesJSON();
      if (Platform.OS === 'web') {
        webDownload(json);
        addLog(`✓ Export: kochwelt-rezepte.json heruntergeladen`);
      } else {
        const path = FileSystem.documentDirectory + 'kochwelt-rezepte.json';
        await FileSystem.writeAsStringAsync(path, json, { encoding: UTF8 });
        addLog(`✓ Export: kochwelt-rezepte.json`);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(path, {
            mimeType: 'application/json',
            dialogTitle: 'kochwelt-rezepte.json speichern',
            UTI: 'public.json',
          });
        } else {
          Alert.alert('Export gespeichert', 'Datei: kochwelt-rezepte.json');
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`✗ Export fehlgeschlagen: ${msg}`);
      Alert.alert('Fehler', msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    setBusy(true);
    try {
      let json: string;

      if (Platform.OS === 'web') {
        json = await webPickFile();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/json', 'text/plain'],
          copyToCacheDirectory: true,
        });
        if (result.canceled) { setBusy(false); return; }
        json = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: UTF8 });
      }

      const { updated, added, errors } = await importRecipesJSON(json);
      addLog(`✓ Import: ${updated} aktualisiert, ${added} neu hinzugefügt`);
      if (errors.length > 0) addLog(`⚠ ${errors.length} Fehler: ${errors.join('; ')}`);
      Alert.alert(
        'Import abgeschlossen',
        `${updated} Rezepte aktualisiert\n${added} neu hinzugefügt${errors.length > 0 ? `\n${errors.length} Fehler` : ''}`,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== 'Abgebrochen') {
        addLog(`✗ Import fehlgeschlagen: ${msg}`);
        Alert.alert('Fehler', msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content}>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="arrow-up-circle-outline" size={24} color="#f97316" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.cardTitle}>Rezepte exportieren</Text>
              <Text style={s.cardDesc}>Alle Rezepte als JSON-Datei herunterladen. Fotos sind nicht enthalten (gerätespezifisch).</Text>
            </View>
          </View>
          <TouchableOpacity style={s.btn} onPress={handleExport} disabled={busy}>
            <Text style={s.btnText}>Exportieren</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="arrow-down-circle-outline" size={24} color="#f97316" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.cardTitle}>Rezepte importieren</Text>
              <Text style={s.cardDesc}>Bearbeitete JSON-Datei einlesen. Bestehende Rezepte werden aktualisiert, neue hinzugefügt. Fotos bleiben erhalten.</Text>
            </View>
          </View>
          <TouchableOpacity style={s.btn} onPress={handleImport} disabled={busy}>
            <Text style={s.btnText}>JSON-Datei auswählen</Text>
          </TouchableOpacity>
        </View>

        <View style={s.hintBox}>
          <Text style={s.hintTitle}>Workflow</Text>
          <Text style={s.hint}>1. Exportieren → JSON öffnen</Text>
          <Text style={s.hint}>2. Rezepte im Texteditor bearbeiten</Text>
          <Text style={s.hint}>3. Datei speichern → Importieren</Text>
          <Text style={[s.hint, { marginTop: 8, fontStyle: 'italic' }]}>
            Tipp: IDs nicht ändern – sie verknüpfen den Import mit dem gespeicherten Rezept.
          </Text>
        </View>

        {log.length > 0 && (
          <View style={s.logBox}>
            {log.map((line, i) => (
              <Text key={i} style={s.logLine}>{line}</Text>
            ))}
          </View>
        )}

        {busy && <ActivityIndicator color="#f97316" style={{ marginTop: 16 }} />}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f4' },
  content: { padding: 16, gap: 16 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    gap: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1c1917' },
  cardDesc: { fontSize: 13, color: '#78716c', marginTop: 3, lineHeight: 19 },

  btn: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },

  hintBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  hintTitle: { fontSize: 13, fontWeight: '700', color: '#ea580c', marginBottom: 4 },
  hint: { fontSize: 13, color: '#78716c' },

  logBox: {
    backgroundColor: '#1c1917',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  logLine: { fontSize: 12, color: '#a8a29e', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
