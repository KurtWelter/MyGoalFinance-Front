// app/Screen/login.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SafeKeyboardScreen from '../../components/ui/SafeKeyboardScreen';
import { useAuth } from '../../store/auth';
import styles from '../../Styles/loginStyles';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Atención', 'Ingresa tu correo y contraseña');
      return;
    }
    try {
      setBusy(true);
      await login(email.trim(), password);
      router.replace('/Screen/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo iniciar sesión');
    } finally {
      setBusy(false);
    }
  };

  return (
    // 👇 sin paddingH aquí para que el degradado tenga ANCHO COMPLETO
    <SafeKeyboardScreen scroll bg="#0f172a" paddingH={0} paddingTop={0}>
      {/* Degradado superior a ANCHO COMPLETO */}
      <LinearGradient
        colors={['#1a2644', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,       // 👈 cubre todo el ancho
          height: 260,
          opacity: 0.95,
        }}
      />

      {/* Contenedor que centra el card y aplica padding lateral */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
        <View style={[styles.box, { width: '100%', maxWidth: 420 }]}>
          <Text style={styles.title}>MyGoalFinance</Text>
          <Text style={styles.subtitle}>Tu futuro financiero comienza aquí</Text>

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#9aa3b2"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#9aa3b2"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />

          <TouchableOpacity
            style={[styles.loginButton, busy && { opacity: 0.7 }]}
            onPress={onSubmit}
            disabled={busy}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Iniciar Sesión</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerButton} onPress={() => router.push('/Screen/register')} disabled={busy}>
            <Text style={styles.registerButtonText}>¿No tienes cuenta? Regístrate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeKeyboardScreen>
  );
}
