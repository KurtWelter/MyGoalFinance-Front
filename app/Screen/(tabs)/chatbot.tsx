// app/Screen/chatbot.tsx
import styles from '@/Styles/chatbotStyles';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import EventSource from 'react-native-event-source';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../constants/api';
import { API_PREFIX, API_URL } from '../../../constants/config';

type MsgUI = { id: string; from: 'user' | 'bot'; text: string; ts?: string };

export default function Chatbot() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<MsgUI>>(null);
  const esRef = useRef<EventSource | null>(null);

  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const [messages, setMessages] = useState<MsgUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // FAB
  const [fabOpen, setFabOpen] = useState(false);

  // posición base del FAB (debajo del header)
  const fabTop =
    Platform.OS === 'ios' ? insets.top + 90 : insets.top + 80;

  // Cargar historial
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const hist = await api.chatHistory();
        if (cancel) return;
        const mapped: MsgUI[] = (hist ?? []).map((m) => ({
          id: String(m.id),
          from: m.sender,
          text: m.message,
          ts: m.timestamp,
        }));
        setMessages(mapped);
        requestAnimationFrame(() =>
          listRef.current?.scrollToEnd({ animated: false })
        );
      } catch (e) {
        console.error('chat history error', e);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
      if (esRef.current) {
        try {
          esRef.current.close();
        } catch {
          // ignore
        }
        esRef.current = null;
      }
    };
  }, []);

  const canSend = useMemo(
    () => input.trim().length > 0 && !sending,
    [input, sending]
  );

  // Lógica común para enviar un mensaje (input o FAB)
  const sendText = async (raw: string) => {
    const text = raw.trim();
    if (!text || sending) return;

    // pinta optimista
    const tempId = `local-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, from: 'user', text }]);
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: true })
    );

    // cerrar stream previo
    if (esRef.current) {
      try {
        esRef.current.close();
      } catch {
        // ignore
      }
      esRef.current = null;
    }

    // ————— Fallback REST —————
    const sendViaRestFallback = async () => {
      try {
        const res = await api.chatSend(text); // POST /api/chat/message
        setMessages((prev) => [
          ...prev,
          {
            id: String(res.bot?.id ?? Date.now()),
            from: 'bot',
            text: res.bot?.message ?? '…',
          },
        ]);
        requestAnimationFrame(() =>
          listRef.current?.scrollToEnd({ animated: true })
        );
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            from: 'bot',
            text: err?.message || 'No pude enviar el mensaje.',
          },
        ]);
      } finally {
        setTyping(false);
        setStreamingText('');
        setSending(false);
      }
    };

    try {
      setSending(true);
      setTyping(true);
      setStreamingText('');

      const token = await AsyncStorage.getItem('token');
      const url = `${API_URL}${API_PREFIX}/chat/stream?q=${encodeURIComponent(
        text
      )}`;

      const es = new EventSource(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      esRef.current = es;

      let acc = '';
      let gotAnyDelta = false;
      let finished = false;

      // si en 4s no llegó nada, cancelar y usar REST
      const startupTimeout = setTimeout(() => {
        if (!gotAnyDelta && !finished) {
          try {
            es.close();
          } catch {
            // ignore
          }
          sendViaRestFallback();
        }
      }, 4000);

      es.onmessage = (evt: any) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload?.delta) {
            gotAnyDelta = true;
            acc += payload.delta;
            setStreamingText(acc);
            requestAnimationFrame(() =>
              listRef.current?.scrollToEnd({ animated: true })
            );
          }
        } catch {
          /* keep-alive u otras líneas no JSON */
        }
      };

      es.addEventListener('done', () => {
        finished = true;
        clearTimeout(startupTimeout);
        setTyping(false);
        setStreamingText('');
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            from: 'bot',
            text: acc.length ? acc : '…',
          },
        ]);
        requestAnimationFrame(() =>
          listRef.current?.scrollToEnd({ animated: true })
        );
        try {
          es.close();
        } catch {
          // ignore
        }
        esRef.current = null;
        setSending(false);
      });

      es.onerror = () => {
        if (finished) return;
        finished = true;
        clearTimeout(startupTimeout);
        try {
          es.close();
        } catch {
          // ignore
        }
        if (!gotAnyDelta) {
          // nada del stream -> REST
          sendViaRestFallback();
        } else {
          // hubo algo, cerramos con lo acumulado
          setTyping(false);
          setStreamingText('');
          setMessages((prev) => [
            ...prev,
            { id: `bot-${Date.now()}`, from: 'bot', text: acc || '…' },
          ]);
          setSending(false);
        }
      };
    } catch (e: any) {
      console.error('stream send error', e?.message || e);
      await sendViaRestFallback();
    }
  };

  const handleSend = () => {
    if (!canSend) return;
    const text = input.trim();
    setInput('');
    sendText(text);
  };

  const handleQuickPrompt = (prompt: string) => {
    setFabOpen(false);
    sendText(prompt);
  };

  const renderItem = ({ item }: { item: MsgUI }) => {
    const isUser = item.from === 'user';
    return (
      <View
        style={[styles.bubbleRow, isUser ? styles.alignEnd : styles.alignStart]}
      >
        <View
          style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.userText : styles.botText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={[]}
      style={{ flex: 1, backgroundColor: '#1f2738', paddingTop: 0 }}
    >
      <LinearGradient colors={['#2b344a', '#1f2738']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Asistente Financiero</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Contenido + teclado */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Chat */}
          <View style={styles.chatBox}>
            {loading ? (
              <View style={styles.centerFill}>
                <ActivityIndicator />
                <Text style={styles.hint}>Cargando conversación…</Text>
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.centerFill}>
                <Text style={styles.welcomeText}>
                  ¿Qué quieres aprender hoy?
                </Text>
              </View>
            ) : (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(m) => m.id}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() =>
                  listRef.current?.scrollToEnd({ animated: true })
                }
                onLayout={() =>
                  listRef.current?.scrollToEnd({ animated: false })
                }
                contentContainerStyle={[
                  styles.chatContent,
                  {
                    paddingBottom:
                      Platform.OS === 'ios'
                        ? insets.bottom +
                          Math.min(120, Math.max(48, inputHeight)) +
                          20
                        : Platform.OS === 'android'
                        ? Math.min(120, Math.max(48, inputHeight)) + 80
                        : Math.min(120, Math.max(48, inputHeight)) + 80,
                  },
                ]}
                ListFooterComponent={
                  typing ? (
                    <View style={[styles.bubbleRow, styles.alignStart]}>
                      <View style={[styles.bubble, styles.botBubble]}>
                        {streamingText ? (
                          <Text style={styles.botText}>{streamingText}</Text>
                        ) : (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <ActivityIndicator size="small" />
                            <Text style={styles.botText}>Escribiendo…</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ) : null
                }
              />
            )}
          </View>

          {/* Barra de entrada */}
          <View
            style={[
              styles.inputBar,
              {
                paddingBottom:
                  Platform.OS === 'ios'
                    ? insets.bottom + 70
                    : Platform.OS === 'android'
                    ? 16
                    : 12,
                marginBottom: Platform.OS === 'web' ? 60 : 0,
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                { height: Math.min(120, Math.max(48, inputHeight)) },
              ]}
              placeholder="Escribe tu consulta…"
              placeholderTextColor="#95a0b5"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              autoCorrect
              blurOnSubmit={false}
              onContentSizeChange={(e) => {
                const h = e.nativeEvent.contentSize?.height ?? 44;
                setInputHeight(h);
              }}
            />
            <TouchableOpacity
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!canSend}
            >
              <Text style={styles.sendButtonText}>
                {sending ? '…' : 'Enviar'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Menú del FAB con atajos (ahora colgando debajo del FAB) */}
        {fabOpen && (
          <View
            style={{
              position: 'absolute',
              right: 24,
              top: fabTop + 60,
              backgroundColor: '#2b344a',
              borderRadius: 16,
              paddingVertical: 10,
              paddingHorizontal: 12,
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 6,
              elevation: 5,
              maxWidth: 260,
            }}
          >
            <Text
              style={{
                color: '#c5d0ea',
                fontSize: 12,
                marginBottom: 6,
                fontWeight: '600',
              }}
            >
              Atajos rápidos
            </Text>

            {[
              {
                label: 'Consejos para ahorrar',
                prompt:
                  'Dame consejos concretos para empezar a ahorrar dinero según buenas prácticas de educación financiera.',
              },
              {
                label: 'Crear presupuesto mensual',
                prompt:
                  'Ayúdame a crear un presupuesto mensual usando la regla 50/30/20, con montos de ejemplo.',
              },
              {
                label: 'Ordenar deudas',
                prompt:
                  'Qué hábitos puedo adoptar para ordenar mis deudas y pagarlas más rápido de forma responsable.',
              },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  borderRadius: 10,
                  backgroundColor: '#39425a',
                  marginTop: 4,
                }}
                onPress={() => handleQuickPrompt(opt.prompt)}
              >
                <Text style={{ color: '#e8edf7', fontSize: 12 }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* FAB arriba a la derecha */}
        <TouchableOpacity
          onPress={() => setFabOpen((v) => !v)}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            right: 24,
            top: fabTop,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#f3b34c',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.35,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 6,
            elevation: 6,
          }}
        >
          <Ionicons
            name={fabOpen ? 'close' : 'sparkles'}
            size={24}
            color="#1f2738"
          />
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}
