import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "./../Styles/registerStyles";
import { useUserStore } from "./store/useQuestionnaireStore"; // ✅ Zustand

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Zustand: guardar user
  const setUser = useUserStore((state) => state.setUser);

  // State local
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Refs para navegar con el teclado
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // Validaciones
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

  const validate = () => {
    const e: { [key: string]: string } = {};
    if (!name.trim()) e.name = "Debe ingresar su nombre";
    if (!email.trim()) e.email = "Debe ingresar su correo";
    else if (!emailRegex.test(email))
      e.email = "Debe ingresar un correo válido (ej: usuario@mail.com)";
    if (!password.trim()) e.password = "Debe ingresar una contraseña";
    else if (!passwordRegex.test(password))
      e.password =
        "La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 caracter especial";
    if (!confirmPassword.trim())
      e.confirmPassword = "Debe confirmar la contraseña";
    else if (password !== confirmPassword)
      e.confirmPassword = "Las contraseñas no coinciden";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;

    // Guardar en Zustand (⚠️ nunca guardes contraseña en claro en prod)
    setUser({ name, email, password });

    console.log("📌 Usuario registrado en Zustand:", { name, email, password });

    // Ir al cuestionario
    router.replace("/Screen/questionnaire/step1");
  };

  return (
    <LinearGradient
      colors={["#526074ff", "#312d69ff"]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
        // Sube un poco en iOS si tienes header (ajusta 80–120 si fuese necesario)
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

            {/* Confirmar Contraseña */}
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
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Registrarse</Text>
            </TouchableOpacity>

            {/* Volver al login */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.replace("/Screen/login")}
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
