import { useTheme } from "react-native-paper";
import { Aviso } from "./Aviso";

export function ErrorCarga({ mensaje, onReintentar }) {
  const { colors } = useTheme();
  const accion = onReintentar
    ? { etiqueta: "Reintentar", onPress: onReintentar, testID: "reintentar" }
    : undefined;
  return (
    <Aviso
      icono="alert-circle-outline"
      color={colors.error}
      texto={mensaje}
      accion={accion}
      testID="error-carga"
    />
  );
}
