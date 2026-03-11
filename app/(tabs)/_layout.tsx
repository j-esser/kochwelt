import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, color }: { name: IoniconsName; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#78716c',
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#e7e5e4' },
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#1c1917',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rezepte',
          tabBarIcon: ({ color }) => <TabIcon name="book-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="planer"
        options={{
          title: 'Planer',
          tabBarIcon: ({ color }) => <TabIcon name="calendar-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Shopping',
          tabBarIcon: ({ color }) => <TabIcon name="cart-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
