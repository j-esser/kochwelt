import '../global.css';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { seedIfEmpty, patchBaselinePhotos, patchBaselineIngredients } from '../services/recipeStore';
import { syncBaselineIfNeeded } from '../services/baselineSync';
import { syncGiftsIfNeeded, deliverPendingGifts } from '../services/giftRecipes';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
