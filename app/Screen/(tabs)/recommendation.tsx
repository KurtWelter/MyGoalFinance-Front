import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import styles from "../../Styles/recommendationStyles";
import { useQuestionnaireStore } from "../store/useQuestionnaireStore";

export default function Recommendation() {
  const router = useRouter();
  const { data } = useQuestionnaireStore();

  // 🔹 Aquí podrías generar recomendaciones según los datos
  const getRecommendations = () => {
    const recs: string[] = [];

    if (data.knowledge === "Básico") {
      recs.push("Empieza por crear un presupuesto mensual simple.");
      recs.push("Ahorra al menos un 10% de tus ingresos cada mes.");
    }
    if (data.knowledge === "Intermedio") {
      recs.push("Considera abrir una cuenta de inversión en fondos mutuos.");
      recs.push("Diversifica tus ahorros entre liquidez y renta fija.");
    }
    if (data.knowledge === "Avanzado") {
      recs.push("Evalúa activos de mayor riesgo como acciones o ETFs.");
      recs.push("Optimiza tu portafolio para reducir impuestos.");
    }

    if (data.goal === "Ahorrar") {
      recs.push("Usa una cuenta de ahorro de alta rentabilidad.");
    }
    if (data.goal === "Invertir") {
      recs.push("Define tu perfil de riesgo antes de invertir.");
    }
    if (data.goal === "Pagar deudas") {
      recs.push("Aplica la estrategia 'avalancha' para reducir intereses.");
    }

    if (recs.length === 0) {
      recs.push("Responde el cuestionario para recibir recomendaciones.");
    }

    return recs;
  };

  const recommendations = getRecommendations();

  return (
    <LinearGradient
      colors={["#526074ff", "#312d69ff"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>💡 Recomendaciones Financieras</Text>
        <Text style={styles.subtitle}>
          Basadas en tu perfil y objetivos, te sugerimos lo siguiente:
        </Text>

        {/* Lista de recomendaciones */}
        {recommendations.map((rec, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.cardText}>• {rec}</Text>
          </View>
        ))}

        {/* Botón para volver */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/Screen/(tabs)/home")}
        >
          <Text style={styles.buttonText}>⬅ Volver al Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}
