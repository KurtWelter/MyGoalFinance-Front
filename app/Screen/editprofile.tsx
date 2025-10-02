import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../constants/api";
import { useAuth } from "../../store/auth";

function ageToRange(ageNum: number) {
  if (ageNum <= 0 || Number.isNaN(ageNum)) return null;
  if (ageNum <= 25) return "18-25";
  if (ageNum <= 35) return "26-35";
  if (ageNum <= 45) return "36-45";
  return "46+";
}

function toExperience(v: string): "beginner" | "intermediate" | "advanced" {
  const s = v.trim().toLowerCase();
  if (s.startsWith("bás") || s.startsWith("bas")) return "beginner";
  if (s.startsWith("inter")) return "intermediate";
  return "advanced";
}

export default function EditProfile() {
  const router = useRouter();
  const { user, refreshMe } = useAuth();

  // Prefills desde lo que ya tenga el user
  const [age, setAge] = useState(
    user?.age_range?.match(/^\d+/)?.[0] ?? "" // toma primer número del rango si existe
  );
  const [level, setLevel] = useState(
    user?.experience === "beginner"
      ? "Básico"
      : user?.experience === "intermediate"
      ? "Intermedio"
      : user?.experience === "advanced"
      ? "Avanzado"
      : ""
  );
  const [income, setIncome] = useState(
    user?.monthly_income != null ? String(user.monthly_income) : ""
  );
  const [goal, setGoal] = useState(user?.finance_goal ?? "");
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    try {
      setBusy(true);

      const ageNum = Number(age);
      const age_range = ageToRange(ageNum);
      if (!age_range) {
        Alert.alert("Valida tu edad", "Ingresa una edad válida.");
        return;
      }

      const monthly_income = Number(income);
      if (Number.isNaN(monthly_income) || monthly_income < 0) {
        Alert.alert("Valida tus ingresos", "Ingresa un número válido.");
        return;
      }

      const payload = {
        age_range,
        experience: toExperience(level),
        monthly_income,
        finance_goal: goal.trim(),
      };

      // Persistir en backend
      await api.updateProfile(payload);

      // Refrescar user en el store (usado por la pantalla de Perfil)
      await refreshMe();

      Alert.alert("¡Guardado!", "Tu perfil fue actualizado.");
      router.replace("/Screen/(tabs)/profile");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={["#526074ff", "#312d69ff"]} style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 16,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
            ✏️ Editar Perfil
          </Text>

          <Text>🎂 Edad</Text>
          <TextInput
            placeholder="18"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 10,
            }}
          />

          <Text>📊 Nivel en Finanzas</Text>
          <TextInput
            placeholder="Básico / Intermedio / Avanzado"
            value={level}
            onChangeText={setLevel}
            autoCapitalize="sentences"
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 10,
            }}
          />

          <Text>💰 Ingresos</Text>
          <TextInput
            placeholder="500000"
            keyboardType="numeric"
            value={income}
            onChangeText={setIncome}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 10,
            }}
          />

          <Text>🎯 Meta Financiera</Text>
          <TextInput
            placeholder="Ahorrar / Pagar deudas..."
            value={goal}
            onChangeText={setGoal}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 10,
            }}
          />

          <TouchableOpacity
            onPress={onSave}
            disabled={busy}
            style={{
              backgroundColor: "#ffa000",
              borderRadius: 8,
              padding: 14,
              alignItems: "center",
              marginTop: 8,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                💾 Guardar Cambios
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            disabled={busy}
            style={{ padding: 12, alignItems: "center" }}
          >
            <Text style={{ color: "#334155" }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}
