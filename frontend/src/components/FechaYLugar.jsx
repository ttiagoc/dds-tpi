import { Text, useTheme } from "react-native-paper";
import { formatearFecha } from "../utils/formato";

export function FechaYLugar({ fecha, lugar, variant = "bodyMedium", atenuado = true }) {
  const { colors } = useTheme();
  return (
    <Text variant={variant} style={atenuado ? { color: colors.onSurfaceVariant } : undefined}>
      {`${formatearFecha(fecha)} · ${lugar}`}
    </Text>
  );
}
