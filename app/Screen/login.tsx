import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import styles from "../../Styles/loginStyles";
import { useAuth } from "../../store/auth";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Atención", "Ingresa tu correo y contraseña");
      return;
    }
    try {
      setBusy(true);
      await login(email.trim(), password);
      router.replace("/Screen/(tabs)/home");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo iniciar sesión");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={["#2862b4ff", "#808620ff"]} style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>MyGoalFinance</Text>
        <Text style={styles.subtitle}>Tu futuro financiero comienza aquí</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          returnKeyType="next"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />

        <TouchableOpacity
          style={[styles.loginButton, busy && { opacity: 0.7 }]}
          onPress={onSubmit}            // ← antes decía handleLogin
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => router.push("/Screen/register")}
          disabled={busy}
        >
          <Text style={styles.registerButtonText}>
            ¿No tienes cuenta? Regístrate
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
