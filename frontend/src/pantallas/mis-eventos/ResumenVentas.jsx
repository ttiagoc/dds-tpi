import { StyleSheet, View } from "react-native";
import { TarjetaPlana } from "../../components/TarjetaPlana";
import { Text, useTheme } from "react-native-paper";
import { espaciado } from "../../tema/espaciado";
import { formatearPrecio } from "../../utils/formato";

function Dato({ etiqueta, valor, testID }) {
  const { colors } = useTheme();
  return (
    <TarjetaPlana
      style={estilos.dato}
      accessible
      accessibilityLabel={`${etiqueta}: ${valor}`}
      testID={testID}
    >
      <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
        {etiqueta}
      </Text>
      <Text variant="titleLarge" style={estilos.numero}>
        {valor}
      </Text>
    </TarjetaPlana>
  );
}

export function ResumenVentas({ resumen }) {
  if (!resumen) return null;
  return (
    <View style={estilos.fila}>
      <Dato
        etiqueta="Recaudado"
        valor={formatearPrecio(resumen.recaudado)}
        testID="resumen-recaudado"
      />
      <Dato
        etiqueta="Entradas vendidas"
        valor={String(resumen.vendidas)}
        testID="resumen-vendidas"
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", gap: espaciado.sm + 2 },
  dato: {
    flex: 1,
    gap: 2,
    paddingVertical: espaciado.md + 2,
    paddingHorizontal: espaciado.lg,
  },
  numero: { fontVariant: ["tabular-nums"] },
});
