import { StyleSheet, View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import { ChipEstado } from "./ChipEstado";
import { FechaYLugar } from "./FechaYLugar";
import { Troquel } from "./Troquel";
import { espaciado, radios } from "../tema/espaciado";
import { useEstadoCompra } from "../tema/useEstadoCompra";
import { formatearPrecio, textoDiasRestantes } from "../utils/formato";

export function TarjetaCompra({ compra, onPress, conComprador = false }) {
  const { colors } = useTheme();
  const { id, estado, cantidad, total, evento, tipoEntrada } = compra;
  const { etiqueta: etiquetaEstado } = useEstadoCompra(estado);
  const dias = textoDiasRestantes(compra.diasRestantes);
  const titulo = conComprador ? compra.comprador.nombre : evento.nombre;
  const etiqueta = [titulo, etiquetaEstado, dias].filter(Boolean).join(", ");
  const apagado = { color: colors.onSurfaceVariant };
  return (
    <TouchableRipple
      onPress={onPress}
      style={[
        estilos.tarjeta,
        { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
      ]}
      testID={`compra-${id}`}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
    >
      <View>
        <View style={estilos.datos}>
          <Text variant="titleMedium">{titulo}</Text>
          {!conComprador && <FechaYLugar fecha={evento.fecha} lugar={evento.lugar} atenuado />}
          <Text variant="bodyMedium" style={apagado}>
            {`${tipoEntrada.nombre} × ${cantidad} · ${formatearPrecio(total)}`}
          </Text>
        </View>
        <Troquel testID={`troquel-${id}`} />
        <View style={estilos.pie}>
          <ChipEstado estado={estado} />
          {dias && (
            <Text variant="labelLarge" style={apagado} testID={`dias-restantes-${id}`}>
              {dias}
            </Text>
          )}
        </View>
      </View>
    </TouchableRipple>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: radios.lg },
  datos: { gap: espaciado.xs, padding: espaciado.lg },
  pie: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: espaciado.lg,
    paddingVertical: espaciado.md,
  },
});
