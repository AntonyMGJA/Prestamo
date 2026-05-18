import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#BD38FF',
        tabBarInactiveTintColor: '#8e8e93',
        headerStyle: { backgroundColor: '#BD38FF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pendientes',
          headerTitle: '💰 Deudores Pendientes',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "list" : "list-outline"} size={24} color={color} />,
        }}
      />
      {/* ELIMINADO EL SLOCK DE WALLET AQUÍ */}
      <Tabs.Screen
        name="paid"
        options={{
          title: 'Saldados',
          headerTitle: '✅ Historial de Saldados',
          headerStyle: { backgroundColor: '#2dd36f' },
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "checkmark-done-circle" : "checkmark-done-circle-outline"} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Nuevo',
          headerTitle: '➕ Registrar Préstamo',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person-add" : "person-add-outline"} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reportes',
          headerTitle: '📈 Reportes Avanzados',
          headerStyle: { backgroundColor: '#3dc2ff' },
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "trending-up" : "trending-up-outline"} size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}