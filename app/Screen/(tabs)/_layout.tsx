import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: 'Inicio', tabBarIcon: ({color,size}) => <Ionicons name="home" color={color} size={size}/> }} />
      <Tabs.Screen name="goals" options={{ title: 'Metas', tabBarIcon: ({color,size}) => <Ionicons name="flag" color={color} size={size}/> }} />
      <Tabs.Screen name="news" options={{ title: 'Noticias', tabBarIcon: ({color,size}) => <Ionicons name="newspaper" color={color} size={size}/> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({color,size}) => <Ionicons name="person" color={color} size={size}/> }} />
      <Tabs.Screen name="recap" options={{ title: 'Resumen', tabBarIcon: ({color,size}) => <Ionicons name="stats-chart" color={color} size={size}/> }} />
      <Tabs.Screen name="recommendation" options={{ title: 'Recomendado', tabBarIcon: ({color,size}) => <Ionicons name="sparkles" color={color} size={size}/> }} />
      {/* NUEVAS */}
      <Tabs.Screen name="transactions" options={{ title: 'Movimientos', tabBarIcon: ({color,size}) => <Ionicons name="swap-vertical" color={color} size={size}/> }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({color,size}) => <Ionicons name="analytics" color={color} size={size}/> }} />
    </Tabs>
  );
}
