import { StyleSheet, View } from "react-native";
import { Card, Chip, Text } from "react-native-paper";
import { BarraDeVentas } from "../../components/BarraDeVentas";
import { FechaYLugar } from "../../components/FechaYLugar";
import { espaciado, radios } from "../../tema/espaciado";
import { formatearFecha, formatearPrecio } from "../../utils/formato";

const etiquetaDe = ({ nombre, fecha, lugar, vendidas, cupo, recaudado, finalizado }) =>
  [
    nombre,
    formatearFecha(fecha),
    lugar,
    `${vendidas} de ${cupo} vendidas`,
    `recaudado ${formatearPrecio(recaudado)}`,
    ...(finalizado ? ["finalizado"] : []),
  ].join(", ");

export function TarjetaEventoPropio({ evento, onPress }) {
  const { id, nombre, fecha, lugar, vendidas, cupo, recaudado, finalizado } = evento;
  return (
    <Card
      mode="outlined"
      style={estilos.tarjeta}
      onPress={onPress}
      testID={`evento-propio-${id}`}
      accessibilityLabel={etiquetaDe(evento)}
    >
      <Card.Content style={estilos.contenido}>
        <View style={estilos.titulo}>
          <Text variant="titleMedium" style={estilos.nombre}>
            {nombre}
          </Text>
          {finalizado && (
            <Chip compact icon="flag-checkered">
              Finalizado
            </Chip>
          )}
        </View>
        <FechaYLugar fecha={fecha} lugar={lugar} />
        <BarraDeVentas vendidas={vendidas} cupo={cupo} />
        <Text variant="titleSmall">{`Recaudado ${formatearPrecio(recaudado)}`}</Text>
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderRadius: radios.lg },
  contenido: { gap: espaciado.xs },
  titulo: { flexDirection: "row", alignItems: "center", gap: espaciado.sm },
  nombre: { flex: 1 },
});
