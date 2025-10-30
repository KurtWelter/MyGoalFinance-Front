import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import i18n from '../i18n'; // ajusta la ruta si tu i18n está en otra carpeta

type LangOption = { code: 'es' | 'en'; label: string };

const OPTIONS: LangOption[] = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const current = (i18n.language?.slice(0, 2) as 'es' | 'en') || 'es';
  const currentLabel = useMemo(
    () => (current === 'es' ? 'ES' : 'EN'),
    [current]
  );

  const change = async (code: 'es' | 'en') => {
    try {
      // ⚠️ i18next quiere 'es'/'en' en minúscula
      await i18n.changeLanguage(code);
      await AsyncStorage.setItem('app.lang', code);
    } catch (e) {
      // no hacemos reload, ni navegamos: cero pantallazo negro
      console.warn('changeLanguage error', e);
    } finally {
      setOpen(false);
    }
  };

  return (
    <View style={{ position: 'absolute', top: 32, right: 20, zIndex: 50 }}>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: 24,
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}
      >
        <Ionicons name="globe" size={18} color="#fff" />
        <Text style={{ color: '#fff', marginLeft: 6, fontWeight: '700' }}>
          {currentLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#fff" style={{ marginLeft: 6 }} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}
        >
          <View style={{ width: 220, backgroundColor: '#0f172a', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            {OPTIONS.map((opt) => {
              const active = opt.code === current;
              return (
                <Pressable
                  key={opt.code}
                  onPress={() => change(opt.code)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: active ? '800' : '600', fontSize: 16 }}>
                    {opt.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={18} color="#fff" style={{ marginLeft: 'auto' }} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
