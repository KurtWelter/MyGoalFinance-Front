// app/Screen/(tabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../constants/api';
import { useAuth } from '../../../store/auth';
import styles from '../../../Styles/profileStyles';

const ACCENT = '#ffb300';

export default function Profile() {
  const router = useRouter();
  const { user: profile, refreshMe, logout } = useAuth();
  const [uploading, setUploading] = useState(false);

  const name = profile?.name || 'Usuario';
  const email = profile?.email;
  const avatarUrl = (profile as any)?.avatar_url || '';

  const initials = useMemo(() => {
    const parts = (name || '').split(' ').filter(Boolean);
    return (parts[0]?.[0] || 'U') + (parts[1]?.[0] || '');
  }, [name]);

  const onPickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permiso requerido', 'Autoriza tu galería para cambiar el avatar.');
      }

      const pic = await ImagePicker.launchImageLibraryAsync({
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (pic.canceled) return;
      const uri = pic.assets?.[0]?.uri;
      if (!uri) return;

      setUploading(true);
      await api.uploadAvatar(uri);
      await refreshMe();
      Alert.alert('Listo', 'Tu foto de perfil fue actualizada.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo actualizar el avatar');
    } finally {
      setUploading(false);
    }
  };

  const onEditProfile = () => router.push('/Screen/editprofile');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <LinearGradient colors={['#2e3b55', '#1f2738']} style={styles.header}>
        <Text style={styles.brand}>MyGoalFinance</Text>
        <Text style={styles.h1}>Mi Perfil</Text>
        <Text style={styles.subtitle}>Gestiona tu información personal</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Card Avatar */}
        <View style={styles.card}>
          <View style={styles.centerCol}>
            <View style={{ position: 'relative' }}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImg}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}

              <Pressable onPress={onPickAvatar} style={styles.fab} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator color="#1f2738" />
                ) : (
                  <Ionicons name="camera" size={18} color="#1f2738" />
                )}
              </Pressable>
            </View>

            <Text style={styles.name}>{name}</Text>
            {!!email && <Text style={styles.meta}>{email}</Text>}
          </View>
        </View>

        {/* Card Info */}
        <View style={styles.card}>
          <View style={styles.rowHeader}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <Pressable onPress={onEditProfile} hitSlop={8} style={styles.linkBtn}>
              <Ionicons name="create-outline" size={16} color={ACCENT} />
              <Text style={styles.linkText}>Editar</Text>
            </Pressable>
          </View>

          <Item label="Edad" value={profile?.age_range || '—'} />
          <Item label="Nivel en finanzas" value={mapLevel(profile?.experience)} />
          <Item label="Ingresos mensuales" value={fmtCLP(profile?.monthly_income)} />
          <Item label="Meta financiera principal" value={profile?.finance_goal || '—'} />
        </View>

        {/* Acciones */}
        <View style={styles.rowBtns}>
          <Pressable style={[styles.btnPrimary, { flex: 1 }]} onPress={onEditProfile}>
            <Ionicons name="create" size={18} color="#1f2738" />
            <Text style={styles.btnPrimaryText}>Editar Perfil</Text>
          </Pressable>
          <Pressable style={[styles.btnGhost, { flex: 1 }]} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color="#e11d48" />
            <Text style={[styles.btnGhostText, { color: '#e11d48' }]}>Cerrar sesión</Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- UI bits ---------- */

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.itemValue}>{value ?? '—'}</Text>
    </View>
  );
}

function mapLevel(x?: string) {
  if (!x) return '—';
  if (x === 'beginner') return 'Básico';
  if (x === 'intermediate') return 'Intermedio';
  if (x === 'advanced') return 'Avanzado';
  return x;
}

function fmtCLP(n?: number | string | null) {
  if (n == null) return '—';
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  try {
    return num.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    });
  } catch {
    return `$${Math.round(num)}`;
  }
};
