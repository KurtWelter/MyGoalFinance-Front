import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import styles from "../Styles/editprofileStyles";
import { useQuestionnaireStore } from "./store/useQuestionnaireStore"; // Zustand

export default function EditProfile() {
  const router = useRouter();
  const { data, setAgeRange, setKnowledge, setIncome, setGoal } =
    useQuestionnaireStore();

  // Estado local para edición
  const [form, setForm] = useState({
    ageRange: data.ageRange,
    knowledge: data.knowledge,
    income: data.income,
    goal: data.goal,
  });

  // Guardar cambios
  const handleSave = () => {
    if (!form.ageRange || !form.knowledge || !form.income || !form.goal) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    // Actualizar Zustand
    setAgeRange(form.ageRange);
    setKnowledge(form.knowledge);
    setIncome(form.income);
    setGoal(form.goal);

    // Aquí podrías conectar a tu backend (Supabase/Django):
    // await supabase.from("users").update(form).eq("id", userId);

    Alert.alert("Éxito", "Perfil actualizado correctamente 🎉");
    router.replace("/Screen/(tabs)/profile"); // vuelve al perfil
  };

  return (
    <LinearGradient
      colors={["#526074ff", "#312d69ff"]}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>✏️ Editar Perfil</Text>

        {/* Edad */}
        <Text style={styles.label}>🎂 Edad</Text>
        <TextInput
          style={styles.input}
          value={form.ageRange}
          onChangeText={(text) => setForm({ ...form, ageRange: text })}
          placeholder="Ej: 26-35"
        />

        {/* Nivel Finanzas */}
        <Text style={styles.label}>📊 Nivel en Finanzas</Text>
        <TextInput
          style={styles.input}
          value={form.knowledge}
          onChangeText={(text) => setForm({ ...form, knowledge: text })}
          placeholder="Ej: Básico, Intermedio, Avanzado"
        />

        {/* Ingresos */}
        <Text style={styles.label}>💰 Ingresos</Text>
        <TextInput
          style={styles.input}
          value={form.income}
          onChangeText={(text) => setForm({ ...form, income: text })}
          placeholder="Ej: Menos de $1000"
          keyboardType="default"
        />

        {/* Meta Financiera */}
        <Text style={styles.label}>🎯 Meta Financiera</Text>
        <TextInput
          style={styles.input}
          value={form.goal}
          onChangeText={(text) => setForm({ ...form, goal: text })}
          placeholder="Ej: Ahorrar, Invertir, Pagar deudas"
        />

        {/* Botón Guardar */}
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>💾 Guardar Cambios</Text>
        </TouchableOpacity>

        {/* Cancelar */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
