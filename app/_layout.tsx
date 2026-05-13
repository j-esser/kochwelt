import '../global.css';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useShareIntent } from 'expo-share-intent';
import { seedIfEmpty, patchBaselinePhotos, patchBaselineIngredients } from '../services/recipeStore';
import { syncBaselineIfNeeded } from '../services/baselineSync';
import { syncGiftsIfNeeded, deliverPendingGifts } from '../services/giftRecipes';

// Extrahiert die erste http(s)-URL aus freiem Text (Share-Intents von Android
// liefern oft "Tolles Rezept: https://chefkoch.de/rezepte/123/foo.html").
function extractUrl(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  useEffect(() => {
    (async () => {
      // Nur seedIfEmpty bleibt im blockierenden Pfad — sicherzustellen, dass beim
      // allerersten Start die Daten existieren bevor UI rendert. Auf Bestandsdaten
      // ist es ein No-Op (ein einzelner AsyncStorage-getItem-Check).
      const t0 = Date.now();
      await seedIfEmpty();
      if (__DEV__) console.log('[boot] seeded', Date.now() - t0, 'ms');
      SplashScreen.hideAsync();

      // Migrations + Syncs als deferred Work nach erstem Frame.
      // Side-Effects laufen, während User die App schon nutzen kann.
      InteractionManager.runAfterInteractions(async () => {
        try {
          await patchBaselineIngredients();
          await patchBaselinePhotos();
          if (__DEV__) console.log('[boot] migrations done', Date.now() - t0, 'ms');
        } catch {/* still */}
        syncBaselineIfNeeded().catch(() => {});
        syncGiftsIfNeeded().then(() => deliverPendingGifts()).catch(() => {});
      });
    })();
  }, []);

  // Share-Intent: wenn Kochwelt aus dem Android-Share-Sheet (z.B. Chefkoch) als
  // Ziel gewählt wurde, ziehen wir die enthaltene URL und springen direkt in
  // "Neues Rezept" mit auto-Import.
  useEffect(() => {
    if (!hasShareIntent) return;
    const url = shareIntent.webUrl || extractUrl(shareIntent.text);
    if (url) {
      router.push({ pathname: '/recipe/new', params: { importUrl: url } });
    }
    resetShareIntent();
  }, [hasShareIntent, shareIntent, router, resetShareIntent]);

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="recipe/[id]" options={{ headerShown: true, headerBackTitle: 'Zurück' }} />
        <Stack.Screen name="recipe/new" options={{ headerShown: true, headerBackTitle: 'Zurück' }} />
        <Stack.Screen name="recipe/edit/[id]" options={{ headerShown: true, headerBackTitle: 'Zurück' }} />
        <Stack.Screen name="recipe/pick" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="tools" options={{ title: 'Export / Import', headerBackTitle: 'Zurück' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
