import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useQuestionnaireStore } from "../store/useQuestionnaireStore";

export default function Step4() {
  const router = useRouter();
  const { data, setGoal, reset } = useQuestionnaireStore();

  const handleSelect = (goal: string) => {
    setGoal(goal);

    // Aquí ya tienes TODO el cuestionario
    console.log("📌 Respuestas completas:", data);

    // Luego aquí conectas con tu backend
    Alert.alert("¡Listo!", "Tu perfil financiero ha sido configurado");

    reset(); // limpia el estado
    router.replace("/Screen/(tabs)/home");
  };

  return (
    <LinearGradient colors={["#526074ff", "#312d69ff"]} style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: "center", padding: 30 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "#fff",
            marginBottom: 20,
          }}
        >
          ¿Cuál es tu principal objetivo financiero?
        </Text>

        {["Ahorrar", "Invertir", "Salir de deudas", "Otro"].map((option) => (
          <TouchableOpacity
            key={option}
            style={{
              backgroundColor: "#fff",
              padding: 15,
              borderRadius: 8,
              marginBottom: 12,
            }}
            onPress={() => handleSelect(option)}
          >
            <Text style={{ fontSize: 16, textAlign: "center" }}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
}
