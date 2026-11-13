import { StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { ChipEstado } from "./ChipEstado";
import { FechaYLugar } from "./FechaYLugar";
import { espaciado } from "../tema/espaciado";
import { useEstadoCompra } from "../tema/useEstadoCompra";
import { formatearPrecio, textoDiasRestantes } from "../utils/formato";

export function TarjetaCompra({ compra, onPress, conComprador = false }) {
  const { colors } = useTheme();
  const { id, estado, cantidad, total, evento, tipoEntrada } = compra;
  const { etiqueta: etiquetaEstado } = useEstadoCompra(estado);
  const dias = textoDiasRestantes(compra.diasRestantes);
  const titulo = conComprador ? compra.comprador.nombre : evento.nombre;
  const etiqueta = [titulo, etiquetaEstado, dias].filter(Boolean).join(", ");
  return (
    <Card mode="elevated" onPress={onPress} testID={`compra-${id}`} accessibilityLabel={etiqueta}>
      <Card.Content style={estilos.contenido}>
        <Text variant="titleMedium">{titulo}</Text>
        {!conComprador && <FechaYLugar fecha={evento.fecha} lugar={evento.lugar} />}
        <Text variant="bodyMedium">
          {`${tipoEntrada.nombre} × ${cantidad} · ${formatearPrecio(total)}`}
        </Text>
        <View style={estilos.pie}>
          <ChipEstado estado={estado} />
          {dias && (
            <Text
              variant="labelLarge"
              style={{ color: colors.primary }}
              testID={`dias-restantes-${id}`}
            >
              {dias}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: espaciado.xs },
  pie: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: espaciado.xs,
  },
});
