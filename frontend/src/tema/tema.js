import { DarkTheme, DefaultTheme } from "expo-router";
import { MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from "react-native-paper";

export const ESTADOS_COMPRA = ["PENDIENTE", "CONFIRMADA", "UTILIZADA", "CANCELADA", "REEMBOLSADA"];

const ESTADOS_BASE = {
  PENDIENTE: { etiqueta: "Pendiente", icono: "clock-outline" },
  CONFIRMADA: { etiqueta: "Confirmada", icono: "check-circle-outline" },
  UTILIZADA: { etiqueta: "Utilizada", icono: "ticket-confirmation-outline" },
  CANCELADA: { etiqueta: "Cancelada", icono: "close-circle-outline" },
  REEMBOLSADA: { etiqueta: "Reembolsada", icono: "cash-refund" },
};

const COLORES_ESTADO_CLARO = {
  PENDIENTE: { fondo: "#FFE08A", texto: "#3D2E00" },
  CONFIRMADA: { fondo: "#C3EFC5", texto: "#0B3D14" },
  UTILIZADA: { fondo: "#D3E3FD", texto: "#0B2A55" },
  CANCELADA: { fondo: "#FFDAD6", texto: "#5C0B0B" },
  REEMBOLSADA: { fondo: "#EADDFF", texto: "#2A0E5C" },
};

const COLORES_ESTADO_OSCURO = {
  PENDIENTE: { fondo: "#5A4300", texto: "#FFE08A" },
  CONFIRMADA: { fondo: "#1E5128", texto: "#C3EFC5" },
  UTILIZADA: { fondo: "#24406E", texto: "#D3E3FD" },
  CANCELADA: { fondo: "#7A1C1C", texto: "#FFDAD6" },
  REEMBOLSADA: { fondo: "#4A2C86", texto: "#EADDFF" },
};

const conColores = (colores) =>
  Object.fromEntries(
    ESTADOS_COMPRA.map((estado) => [estado, { ...ESTADOS_BASE[estado], ...colores[estado] }]),
  );

export const temaClaro = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#8E2DA8",
    onPrimary: "#FFFFFF",
    primaryContainer: "#FAD8FF",
    onPrimaryContainer: "#350040",
    secondary: "#9C4234",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#FFDAD3",
    onSecondaryContainer: "#3E0400",
  },
  estados: conColores(COLORES_ESTADO_CLARO),
};

export const temaOscuro = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#F0B0FF",
    onPrimary: "#560066",
    primaryContainer: "#731A8E",
    onPrimaryContainer: "#FAD8FF",
    secondary: "#FFB4A5",
    onSecondary: "#5F150A",
    secondaryContainer: "#7D2B1F",
    onSecondaryContainer: "#FFDAD3",
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
