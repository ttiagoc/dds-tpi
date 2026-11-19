import { StyleSheet, View } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";
import { BarraDeVentas } from "../../components/BarraDeVentas";
import { espaciado, radios } from "../../tema/espaciado";
import { textoDisponibilidad } from "../../utils/formato";

export function TipoDisponible({ tipo }) {
  const { colors } = useTheme();
  return (
    <Surface
      style={[estilos.tipo, { borderColor: colors.outlineVariant }]}
      elevation={0}
      testID={`disponibilidad-${tipo.tipoEntradaId}`}
    >
      <View style={estilos.fila}>
        <Text variant="titleSmall">{tipo.nombre}</Text>
        <Text variant="labelLarge">{textoDisponibilidad(tipo.disponibles)}</Text>
      </View>
      <BarraDeVentas vendidas={tipo.vendidas} cupo={tipo.cupo} />
    </Surface>
  );
}

const estilos = StyleSheet.create({
  tipo: { gap: espaciado.xs, padding: espaciado.md, borderWidth: 1, borderRadius: radios.lg },
  fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
