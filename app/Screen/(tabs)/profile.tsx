// app/Screen/Profile.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import styles from "../../Styles/profileStyles";
import { useQuestionnaireStore } from "../store/useQuestionnaireStore"; // Zustand

export default function Profile() {
  const router = useRouter();
  const {
    data: { ageRange, knowledge, income, goal },
  } = useQuestionnaireStore();

  // Avatar dinámico con inicial del nombre (ejemplo)
  const avatarUri = "https://i.pravatar.cc/300?u=" + (ageRange || "user");

  return (
    <LinearGradient
      colors={["#526074ff", "#312d69ff"]}
      style={styles.container}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        <Text style={styles.userName}>Mi Perfil</Text>
      </View>

      {/* Card con información */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Información Personal</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>🎂 Edad:</Text>
          <Text style={styles.value}>{ageRange || "No definido"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>📊 Nivel Finanzas:</Text>
          <Text style={styles.value}>{knowledge || "No definido"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>💰 Ingresos:</Text>
          <Text style={styles.value}>{income || "No definido"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>🎯 Meta Financiera:</Text>
          <Text style={styles.value}>{goal || "No definido"}</Text>
        </View>
      </View>

      {/* Botón para editar */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/Screen/editprofile")}
      >
        <Text style={styles.buttonText}>✏️ Editar Perfil</Text>
      </TouchableOpacity>

      {/* Volver al Home */}
      <TouchableOpacity
        style={styles.link}
        onPress={() => router.replace("/Screen/(tabs)/home")}
      >
        <Text style={styles.linkText}>⬅ Volver al Home</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}
