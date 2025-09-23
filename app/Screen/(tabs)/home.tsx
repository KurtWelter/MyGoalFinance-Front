import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Header from "../../../components/ui/Header";
import styles from "../../Styles/homeStyles";

export default function Home() {
  const userName = "Alfredo";
  const router = useRouter();

  return (
    <LinearGradient colors={["#f5f7fa", "#172e53ff"]} style={styles.container}>
      {/* Header personalizado */}
      <Header userName={userName} />

      {/* Contenido principal */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Bienvenida */}
        <View style={styles.header}>
          <Text style={styles.welcome}>¡Hola, {userName}! 👋</Text>
          <Text style={styles.subtitle}>
            Este es tu panel de control financiero
          </Text>
        </View>

        {/* Card Metas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tus Metas 🎯</Text>
          <Text style={styles.cardText}>
            Actualmente tienes 2 metas activas. ¡Sigue adelante!
          </Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push("/Screen/(tabs)/goals")} // 👈 navega a Goals
          >
            <Text style={styles.cardButtonText}>Ver metas</Text>
          </TouchableOpacity>
        </View>

        {/* Card Recomendaciones */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recomendaciones 💡</Text>
          <Text style={styles.cardText}>
            Basado en tus hábitos, te sugerimos ahorrar un 10% de tu ingreso.
          </Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push("/Screen/(tabs)/recommendation")} // 👈 navega a Recommendation
          >
            <Text style={styles.cardButtonText}>Ver recomendaciones</Text>
          </TouchableOpacity>
        </View>

        {/* Card Resumen */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen 📊</Text>
          <Text style={styles.cardText}>Tus gastos este mes: $250.000 CLP</Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push("/Screen/(tabs)/recap")} // 👈 navega a Recap
          >
            <Text style={styles.cardButtonText}>Ver resumen</Text>
          </TouchableOpacity>
        </View>

        {/* Card Noticias */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Noticias Financieras 📰</Text>
          <Text style={styles.cardText}>Últimas noticias del mercado...</Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push("/Screen/(tabs)/news")} // 👈 navega a News
          >
            <Text style={styles.cardButtonText}>Ver más noticias</Text>
          </TouchableOpacity>
        </View>

        {/* Card Chatbot */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Asistente Financiero 🤖</Text>
          <Text style={styles.cardText}>
            Haz tus consultas rápidas aquí o abre el asistente completo.
          </Text>

          {/* Botón para abrir Chatbot */}
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push("/Screen/chatbot")} // 👈 navega a Chatbot
          >
            <Text style={styles.cardButtonText}>Abrir Chatbot</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
