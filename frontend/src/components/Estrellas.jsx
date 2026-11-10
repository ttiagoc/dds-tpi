import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { formatearPuntaje } from "../utils/formato";

const ICONOS = { llena: "star", media: "star-half-full", vacia: "star-outline" };

function tipoDeEstrella(posicion, redondeado) {
  if (redondeado >= posicion) return "llena";
  return redondeado >= posicion - 0.5 ? "media" : "vacia";
}

export function Estrellas({ valor, tamanio = 16 }) {
  const { colors } = useTheme();
  if (valor == null) return null;
  const redondeado = Math.round(valor * 2) / 2;
  return (
    <View
      style={estilos.fila}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Puntaje ${formatearPuntaje(valor)} de 5`}
    >
      {[1, 2, 3, 4, 5].map((posicion) => {
        const tipo = tipoDeEstrella(posicion, redondeado);
        return (
          <View key={posicion} testID={`estrella-${tipo}-${posicion}`}>
            <Icon source={ICONOS[tipo]} size={tamanio} color={colors.estrella} />
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({ fila: { flexDirection: "row" } });
