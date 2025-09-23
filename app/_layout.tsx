import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {" "}
      {/* 👈 lo ocultas en todo el stack */}
      <Stack.Screen name="Screen/login" />
      <Stack.Screen name="Screen/register" />
      <Stack.Screen name="Screen/tabs/layout" />
    </Stack>
  );
}
