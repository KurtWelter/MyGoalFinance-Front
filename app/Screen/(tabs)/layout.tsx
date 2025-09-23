import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {" "}
      {/* 👈 Oculta el header */}
      <Tabs.Screen name="home" options={{ title: "Inicio" }} />
      <Tabs.Screen name="goals" options={{ title: "Metas" }} />
      <Tabs.Screen name="news" options={{ title: "Noticias" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
      <Tabs.Screen name="recap" options={{ title: "Resumen" }} />
      <Tabs.Screen name="recommendation" options={{ title: "Recomendado" }} />
    </Tabs>
  );
}
