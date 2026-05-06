import '../global.css';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
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
      await seedIfEmpty();
      await patchBaselineIngredients();
      await patchBaselinePhotos();
      SplashScreen.hideAsync();
      // Baseline-Sync läuft fire-and-forget: blockiert den Start nicht und schreibt nur,
      // wenn der Gist eine neuere Version meldet. User-Eingaben bleiben unangetastet.
      syncBaselineIfNeeded().catch(() => { /* still ignored */ });
      // Gift-Sync + Lieferung: erst Cache aktualisieren, dann fällige Geschenke ausliefern.
      // Banner erscheint beim nächsten Render der Rezepte-Liste.
      syncGiftsIfNeeded()
        .then(() => deliverPendingGifts())
        .catch(() => { /* still ignored */ });
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
