import '../global.css';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="recipe/[id]" options={{ headerShown: true, headerBackTitle: 'Zurück' }} />
        <Stack.Screen name="recipe/new" options={{ headerShown: true, headerBackTitle: 'Zurück' }} />
        <Stack.Screen name="recipe/edit/[id]" options={{ headerShown: true, headerBackTitle: 'Zurück' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
