import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LanguageSelector from '../../components/LanguageSelector';
import SafeKeyboardScreen from '../../components/ui/SafeKeyboardScreen';
import { useAuth } from '../../store/auth';
import styles from '../../Styles/loginStyles';

export default function Login() {
  const { login, setPendingCreds } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm || !password) {
      Alert.alert(
        t('login.alertAttention', 'Atención'),
        t('login.alertEnterCredentials', 'Ingresa tu correo y contraseña')
      );
      return;
    }
    try {
      setBusy(true);
      Keyboard.dismiss();
      await login(emailNorm, password);
      router.replace('/Screen/(tabs)/home');
    } catch (e: any) {
      const msg: string = e?.message || '';
      if (/confirm/i.test(msg) || /not.*confirm/i.test(msg)) {
        setPendingCreds({ email: emailNorm, password });
        Alert.alert(
          t('login.alertConfirmTitle', 'Confirma tu correo'),
          t('login.alertConfirmBody', 'Te enviamos un email de verificación. Confirma y vuelve a intentar.')
        );
        router.replace('/Screen/confirm-email');
        return;
      }
      Alert.alert(t('login.alertError', 'Error'), msg || t('login.alertLoginFailed', 'No se pudo iniciar sesión'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeKeyboardScreen scroll={false} bg="#0f172a" paddingH={0} paddingTop={0}>
      <LanguageSelector />

      <LinearGradient
        colors={['#1a2644', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.95 }}
      />

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 }}>
        <View style={[styles.box, { width: '100%', maxWidth: 380 }]}>
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20,
            backgroundColor: 'rgba(248, 250, 252, 0.8)', opacity: 0.6
          }} />

          <View style={{ position: 'relative', zIndex: 10 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="wallet" size={60} color="#f5a623" />
            </View>

            <Text style={styles.title}>
              {t('login.title2', 'Inicia sesión')}
            </Text>
            <Text style={styles.subtitle}>
              {t('login.subtitle2', 'Ingresa tus credenciales para continuar')}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={t('common.email', 'Correo electrónico')}
              placeholderTextColor="#9aa3b2"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
            />

            <View style={{ position: 'relative' }}>
              <TextInput
                style={[styles.input, { paddingRight: 44 }]}
                placeholder={t('common.password', 'Contraseña')}
                placeholderTextColor="#9aa3b2"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 10, top: 12, padding: 6 }}
                hitSlop={10}
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, busy && { opacity: 0.7 }]}
              onPress={onSubmit}
              disabled={busy}
            >
              {busy
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginButtonText}>{t('login.signIn', 'Iniciar sesión')}</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/Screen/register')}
              disabled={busy}
            >
              <Text style={styles.registerButtonText}>
                {t('login.createAccount', 'Crear cuenta')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeKeyboardScreen>
  );
}
