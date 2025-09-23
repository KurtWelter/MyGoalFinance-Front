import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router"; // 👈 importar router
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import styles from "./../Styles/chatbotStyles"; // 👈 estilos dedicados

export default function Chatbot() {
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { from: "user" | "bot"; text: string }[]
  >([]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    setChatMessages((prev) => [...prev, { from: "user", text: chatInput }]);
    setChatMessages((prev) => [
      ...prev,
      { from: "bot", text: "Entendido, estoy analizando tus finanzas..." },
    ]);
    setChatInput("");
  };

  return (
    <LinearGradient
      colors={["#eaeaebff", "#2d4469ff"]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* 🔙 Botón de retorno */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()} // vuelve a la pantalla anterior
        >
          <Text style={styles.backButtonText}>⬅ Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>🤖 Asistente Financiero</Text>

        {/* Mensajes */}
        <ScrollView style={styles.chatBox}>
          {chatMessages.map((msg, idx) => (
            <Text
              key={idx}
              style={[
                styles.message,
                msg.from === "user" ? styles.userMessage : styles.botMessage,
              ]}
            >
              {msg.text}
            </Text>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu consulta..."
            value={chatInput}
            onChangeText={setChatInput}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}
