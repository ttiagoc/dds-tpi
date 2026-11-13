import { StyleSheet, View } from "react-native";
import { Surface, Text } from "react-native-paper";
import { BarraDeVentas } from "../../components/BarraDeVentas";
import { espaciado, radios } from "../../tema/espaciado";
import { textoDisponibilidad } from "../../utils/formato";

export function TipoDisponible({ tipo }) {
  return (
    <Surface style={estilos.tipo} elevation={1} testID={`disponibilidad-${tipo.tipoEntradaId}`}>
      <View style={estilos.fila}>
        <Text variant="titleSmall">{tipo.nombre}</Text>
        <Text variant="labelLarge">{textoDisponibilidad(tipo.disponibles)}</Text>
      </View>
      <BarraDeVentas vendidas={tipo.vendidas} cupo={tipo.cupo} />
    </Surface>
  );
}

const estilos = StyleSheet.create({
  tipo: { gap: espaciado.xs, padding: espaciado.md, borderRadius: radios.md },
  fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
