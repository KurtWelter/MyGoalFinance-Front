// components/Header.tsx
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../store/auth";
import styles from "../../Styles/headerStyles";

export default function Header({ userName }: { userName: string }) {
  const router = useRouter();
  const { user } = useAuth();

  // 1) Usamos el avatar real si existe
  // 2) Si no, caemos a pravatar con el email o el userName
  const avatarUrl =
    (user as any)?.avatar_url ||
    (user?.email
      ? `https://i.pravatar.cc/150?u=${user.email}`
      : `https://i.pravatar.cc/150?u=${userName}`);

  return (
    <View style={styles.container}>
      {/* Logo / Nombre */}
      <Text style={styles.logo}>MyGoalFinance</Text>

      {/* Avatar */}
      <TouchableOpacity
        // 👉 usa ruta absoluta de expo-router, no el "../../"
        onPress={() => router.push("/Screen/(tabs)/profile")}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
        />
      </TouchableOpacity>
    </View>
  );
}
