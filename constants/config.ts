import { Platform } from "react-native";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000");

// NUEVO: prefijo de rutas
export const API_PREFIX = process.env.EXPO_PUBLIC_API_PREFIX ?? "/api";
