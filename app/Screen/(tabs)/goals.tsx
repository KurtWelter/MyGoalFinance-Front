// app/Screen/goals.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import styles from "../../../Styles/goalsStyles";

type Goal = {
  id: string;
  title: string;
  target: number;
  current: number;
};

export default function Goals() {
  const router = useRouter();

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: "1",
      title: "Ahorrar para emergencia",
      target: 500000,
      current: 150000,
    },
    { id: "2", title: "Pagar deuda tarjeta", target: 300000, current: 80000 },
  ]);

  const [newGoal, setNewGoal] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const handleAddGoal = () => {
    if (!newGoal.trim() || !targetAmount) {
      Alert.alert("Error", "Debes ingresar una meta y un monto");
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal,
      target: parseInt(targetAmount, 10),
      current: 0,
    };

    setGoals((prev) => [...prev, goal]);
    setNewGoal("");
    setTargetAmount("");

    // 🔹 Aquí podrías enviar al backend
  };

  const handleAddContribution = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, current: g.current + amount } : g
      )
    );

    // 🔹 Aquí también puedes enviar el aporte al backend
  };

  return (
    <LinearGradient
      colors={["#526074ff", "#312d69ff"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* 🔙 Botón de retorno */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>⬅ Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>🎯 Mis Metas Financieras</Text>
        <Text style={styles.subtitle}>
          Define, visualiza y sigue el progreso de tus objetivos.
        </Text>

        {/* Formulario nueva meta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Agregar nueva meta</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Viaje a Europa"
            value={newGoal}
            onChangeText={setNewGoal}
          />
          <TextInput
            style={styles.input}
            placeholder="Monto objetivo (CLP)"
            keyboardType="numeric"
            value={targetAmount}
            onChangeText={setTargetAmount}
          />
          <TouchableOpacity style={styles.button} onPress={handleAddGoal}>
            <Text style={styles.buttonText}>➕ Agregar Meta</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de metas */}
        {goals.map((goal) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100);

          return (
            <View key={goal.id} style={styles.card}>
              <Text style={styles.cardTitle}>{goal.title}</Text>
              <Text style={styles.cardText}>
                Progreso: ${goal.current.toLocaleString()} / $
                {goal.target.toLocaleString()} CLP
              </Text>

              {/* Barra de progreso */}
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {progress.toFixed(0)}% completado
              </Text>

              {/* Botones de aporte rápido */}
              <View style={styles.aportContainer}>
                {[10000, 20000, 50000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.aportButton}
                    onPress={() => handleAddContribution(goal.id, amt)}
                  >
                    <Text style={styles.aportButtonText}>
                      +${amt.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}
