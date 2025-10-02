// app/Screen/register.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "../../Styles/registerStyles";
import { useAuth } from "../../store/auth"; // <- usa pendingCreds / setPendingCreds

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { register: registerUser, login, setPendingCreds } = useAuth();

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // refs
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // validators
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Debe ingresar su nombre";
    if (!email.trim()) e.email = "Debe ingresar su correo";
    else if (!emailRegex.test(email)) e.email = "Correo inválido";
    if (!password.trim()) e.password = "Debe ingresar una contraseña";
    else if (!passwordRegex.test(password))
      e.password = "Mín 8, 1 mayúscula y 1 caracter especial";
    if (!confirmPassword.trim()) e.confirmPassword = "Debe confirmar la contraseña";
    else if (password !== confirmPassword) e.confirmPassword = "Las contraseñas no coinciden";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      setBusy(true);

      // 1) Registrar en backend
      const res = await registerUser(name.trim(), email.trim(), password);

      // 2) Si requiere confirmación: guardar creds TEMPORALMENTE y navegar
      if (res?.requires_confirmation) {
        setPendingCreds({ email: email.trim(), password });
        router.replace("../Screen/confirm-email");
        return;
      }

      // 3) Si NO requiere confirmación: login y cuestionario
      await login(email.trim(), password);
      router.replace("/Screen/questionnaire/step1");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo registrar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient
      colors={["#526074ff", "#312d69ff"]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Math.max(16, insets.bottom + 16),
          }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="on-drag"
        >
          <View style={styles.box}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Únete a MyGoalFinance</Text>

            {/* Nombre */}
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="Nombre completo"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            {/* Correo */}
            <TextInput
              ref={emailRef}
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="Correo electrónico"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passRef.current?.focus()}
            />
            {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Contraseña */}
            <TextInput
              ref={passRef}
              style={[styles.input, errors.password ? styles.inputError : null]}
              placeholder="Contraseña"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
            {!!errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            {/* Confirmar contraseña */}
            <TextInput
              ref={confirmRef}
              style={[
                styles.input,
                errors.confirmPassword ? styles.inputError : null,
              ]}
              placeholder="Confirmar contraseña"
              placeholderTextColor="#999"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            {!!errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            {/* Botón Registrar */}
            <TouchableOpacity
              style={[styles.registerButton, busy && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.registerButtonText}>Registrarse</Text>
              )}
            </TouchableOpacity>

            {/* Volver al login */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.replace("/Screen/login")}
              disabled={busy}
            >
              <Text style={styles.loginButtonText}>
                ¿Ya tienes cuenta? Inicia sesión
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
