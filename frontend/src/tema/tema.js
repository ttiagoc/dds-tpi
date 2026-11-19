import { DarkTheme, DefaultTheme } from "expo-router";
import {
  MD3LightTheme,
  MD3DarkTheme,
  adaptNavigationTheme,
  configureFonts,
} from "react-native-paper";

export const ESTADOS_COMPRA = ["PENDIENTE", "CONFIRMADA", "UTILIZADA", "CANCELADA", "REEMBOLSADA"];

const ESTADOS_BASE = {
  PENDIENTE: { etiqueta: "Pendiente", icono: "clock-outline" },
  CONFIRMADA: { etiqueta: "Confirmada", icono: "check-circle-outline" },
  UTILIZADA: { etiqueta: "Utilizada", icono: "ticket-confirmation-outline" },
  CANCELADA: { etiqueta: "Cancelada", icono: "close-circle-outline" },
  REEMBOLSADA: { etiqueta: "Reembolsada", icono: "cash-refund" },
};

const COLORES_ESTADO_CLARO = {
  PENDIENTE: { fondo: "#FBF0D9", texto: "#6B4500" },
  CONFIRMADA: { fondo: "#E4F2EA", texto: "#1F5E3B" },
  UTILIZADA: { fondo: "#E5ECF6", texto: "#2B4A78" },
  CANCELADA: { fondo: "#F8E3E1", texto: "#8E2A22" },
  REEMBOLSADA: { fondo: "#EDE6F5", texto: "#4F3578" },
};

const COLORES_ESTADO_OSCURO = {
  PENDIENTE: { fondo: "#3D2F12", texto: "#F5D58A" },
  CONFIRMADA: { fondo: "#183526", texto: "#A8DDBE" },
  UTILIZADA: { fondo: "#1C2A40", texto: "#B7CBEA" },
  CANCELADA: { fondo: "#401B18", texto: "#F2B8B1" },
  REEMBOLSADA: { fondo: "#2E2340", texto: "#D3C3EE" },
};

const conColores = (colores) =>
  Object.fromEntries(
    ESTADOS_COMPRA.map((estado) => [estado, { ...ESTADOS_BASE[estado], ...colores[estado] }]),
  );

export const FUENTES = Object.freeze({
  texto: "Manrope_500Medium",
  etiqueta: "Manrope_600SemiBold",
  fuerte: "Manrope_700Bold",
  titulo: "Manrope_800ExtraBold",
});

const fuente = (fontFamily, letterSpacing) => ({
  fontFamily,
  fontWeight: "normal",
  ...(letterSpacing != null && { letterSpacing }),
});

const titulo = fuente(FUENTES.titulo, -0.4);

const fuentes = configureFonts({
  config: {
    displayLarge: titulo,
    displayMedium: titulo,
    displaySmall: titulo,
    headlineLarge: titulo,
    headlineMedium: titulo,
    headlineSmall: titulo,
    titleLarge: fuente(FUENTES.titulo, -0.2),
    titleMedium: fuente(FUENTES.fuerte, -0.1),
    titleSmall: fuente(FUENTES.fuerte),
    labelLarge: fuente(FUENTES.fuerte),
    labelMedium: fuente(FUENTES.etiqueta),
    labelSmall: fuente(FUENTES.etiqueta),
    bodyLarge: fuente(FUENTES.texto),
    bodyMedium: fuente(FUENTES.texto),
    bodySmall: fuente(FUENTES.texto),
    default: fuente(FUENTES.texto),
  },
});

const planos = (base, nivel1, nivel2) => ({
  level0: "transparent",
  level1: base,
  level2: nivel1,
  level3: nivel1,
  level4: nivel2,
  level5: nivel2,
});

export const temaClaro = {
  ...MD3LightTheme,
  fonts: fuentes,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#BF4316",
    onPrimary: "#FFFFFF",
    primaryContainer: "#FBE6DC",
    onPrimaryContainer: "#8A2E0C",
    secondary: "#4A4843",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#EFEBE4",
    onSecondaryContainer: "#1C1B19",
    background: "#FAFAF7",
    onBackground: "#1C1B19",
    surface: "#FFFFFF",
    onSurface: "#1C1B19",
    surfaceVariant: "#F2F0EB",
    onSurfaceVariant: "#6B6862",
    outline: "#CFCAC1",
    outlineVariant: "#E7E4DE",
    inverseSurface: "#1C1B19",
    inverseOnSurface: "#FAFAF7",
    inversePrimary: "#FF8A55",
    elevation: planos("#FFFFFF", "#F7F5F1", "#F2F0EB"),
    estrella: "#9A5B00",
  },
  estados: conColores(COLORES_ESTADO_CLARO),
};

export const temaOscuro = {
  ...MD3DarkTheme,
  fonts: fuentes,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#FF8A55",
    onPrimary: "#141311",
    primaryContainer: "#5A230C",
    onPrimaryContainer: "#FFDCCB",
    secondary: "#CFCAC1",
    onSecondary: "#141311",
    secondaryContainer: "#2E2B28",
    onSecondaryContainer: "#F2EFEA",
    background: "#141311",
    onBackground: "#F2EFEA",
    surface: "#1E1C1A",
    onSurface: "#F2EFEA",
    surfaceVariant: "#2A2724",
    onSurfaceVariant: "#A39F97",
    outline: "#4A4641",
    outlineVariant: "#2E2B28",
    inverseSurface: "#F2EFEA",
    inverseOnSurface: "#141311",
    inversePrimary: "#BF4316",
    elevation: planos("#1E1C1A", "#24221F", "#2A2724"),
    estrella: "#FFC94D",
  },
  estados: conColores(COLORES_ESTADO_OSCURO),
};

const adaptados = adaptNavigationTheme({
  reactNavigationLight: DefaultTheme,
  reactNavigationDark: DarkTheme,
  materialLight: temaClaro,
  materialDark: temaOscuro,
});

export const navegacionClara = adaptados.LightTheme;
export const navegacionOscura = adaptados.DarkTheme;
