import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router"; // 👈 importar router
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import styles from "../../Styles/newsStyles"; // 👈 estilos dedicados

export default function News() {
  const router = useRouter();

  const news = [
    {
      id: "1",
      title: "El dólar baja a $920 CLP tras anuncio del Banco Central",
    },
    {
      id: "2",
      title: "Inflación proyectada en 3,2% para el próximo trimestre",
    },
    {
      id: "3",
      title: "Las fintech en Chile superan récord de inversión en 2025",
    },
    { id: "4", title: "Nuevas regulaciones sobre créditos hipotecarios" },
  ];

  return (
    <LinearGradient colors={["#f5f7fa", "#c3cfe2"]} style={styles.container}>
      <View style={styles.content}>
        {/* 🔙 Botón de retorno */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()} // vuelve a la pantalla anterior
        >
          <Text style={styles.backButtonText}>⬅ Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>📰 Noticias Financieras</Text>

        <FlatList
          data={news}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardText}>{item.title}</Text>
              <TouchableOpacity style={styles.cardButton}>
                <Text style={styles.cardButtonText}>Leer más</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </LinearGradient>
  );
}
