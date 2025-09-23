import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import styles from "../../Styles/recapStyles";
import { useQuestionnaireStore } from "../store/useQuestionnaireStore";

export default function Recap() {
  const router = useRouter();
  const { data } = useQuestionnaireStore();

  const handleConfirm = async () => {
    try {
      // 🔹 Aquí iría la conexión al backend
      // await supabase.from("user_profile").insert([data]);
      console.log("📌 Enviando recap al backend:", data);

      Alert.alert("Éxito", "Tu información fue guardada correctamente 🎉");
      router.replace("./Screen/tabs/Home");
    } catch (error) {
      console.error("Error al enviar la información:", error);
      Alert.alert("Error", "No se pudo enviar la información al servidor");
    }
  };

  return (
    <LinearGradient
      colors={["#526074ff", "#312d69ff"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📊 Resumen de tu Perfil</Text>
        <Text style={styles.subtitle}>
          Aquí tienes un resumen de tus datos:
        </Text>

        {/* Tarjeta con los datos */}
        <View style={styles.card}>
          <Text style={styles.item}>
            🎂 <Text style={styles.label}>Edad:</Text>{" "}
            {data.ageRange || "No definido"}
          </Text>
          <Text style={styles.item}>
            📊 <Text style={styles.label}>Nivel en Finanzas:</Text>{" "}
            {data.knowledge || "No definido"}
          </Text>
          <Text style={styles.item}>
            💰 <Text style={styles.label}>Ingresos:</Text>{" "}
            {data.income || "No definido"}
          </Text>
          <Text style={styles.item}>
            🎯 <Text style={styles.label}>Meta Financiera:</Text>{" "}
            {data.goal || "No definido"}
          </Text>
        </View>

        {/* Recomendación inicial (ejemplo) */}
        <View style={styles.recommendation}>
          <Text style={styles.recommendationTitle}>
            ✨ Recomendación inicial
          </Text>
          <Text style={styles.recommendationText}>
            Según tus respuestas, te sugerimos comenzar con un plan de ahorro
            simple y revisar opciones de inversión de bajo riesgo.
          </Text>
        </View>

        {/* Botón confirmar */}
        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirmar y continuar</Text>
        </TouchableOpacity>

        {/* Botón volver */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>⬅ Volver atrás</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}
