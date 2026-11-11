import { useTheme } from "react-native-paper";

export function useEstadoCompra(estado) {
  const { estados, colors } = useTheme();
  return (
    estados[estado] ?? {
      etiqueta: estado,
      icono: "help-circle-outline",
      fondo: colors.surfaceVariant,
      texto: colors.onSurfaceVariant,
    }
  );
}
