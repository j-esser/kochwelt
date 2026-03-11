import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PlanerScreen() {
  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-stone-800">Wochenplaner</Text>
        <Text className="text-stone-500 mt-2">Wochenplanung und Einkaufsliste</Text>
      </View>
    </SafeAreaView>
  );
}
