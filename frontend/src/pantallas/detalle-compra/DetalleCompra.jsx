import { StyleSheet, View } from "react-native";
import { Card, Divider, Text, useTheme } from "react-native-paper";
import { router } from "expo-router";
import { obtenerCompra } from "../../api/comprasApi";
import { ChipEstado } from "../../components/ChipEstado";
import { ConRecursoDeRuta } from "../../components/ConRecursoDeRuta";
import { FechaYLugar } from "../../components/FechaYLugar";
import { ImagenEvento } from "../../components/ImagenEvento";
import { LineaDeTiempo } from "../../components/LineaDeTiempo";
import { Pantalla } from "../../components/Pantalla";
import { espaciado } from "../../tema/espaciado";
import { formatearFecha, formatearPrecio, textoDiasRestantes } from "../../utils/formato";

function Estado({ compra }) {
  const { colors } = useTheme();
  const dias = textoDiasRestantes(compra.diasRestantes);
  return (
    <View style={estilos.estado} testID="compra-estado">
      <ChipEstado estado={compra.estado} />
      {dias && (
        <Text variant="titleMedium" style={{ color: colors.primary }} testID="dias-restantes">
          {dias}
        </Text>
      )}
    </View>
  );
}

function Evento({ evento }) {
  const { colors } = useTheme();
  return (
    <Card
      mode="outlined"
      onPress={() => router.push(`/eventos/${evento.id}`)}
      testID="compra-evento"
      accessibilityLabel={`Ver el evento ${evento.nombre}`}
    >
      <ImagenEvento uri={evento.imagen} nombre={evento.nombre} />
      <Card.Content style={estilos.evento}>
        <Text variant="titleMedium">{evento.nombre}</Text>
        <FechaYLugar fecha={evento.fecha} lugar={evento.lugar} />
      </Card.Content>
    </Card>
  );
}

function Resumen({ compra }) {
  const { colors } = useTheme();
  const { tipoEntrada, cantidad, total, fechaCompra } = compra;
  return (
    <View style={estilos.resumen}>
      <Text variant="bodyLarge">
        {`${tipoEntrada.nombre} × ${cantidad} · ${formatearPrecio(tipoEntrada.precio)} c/u`}
      </Text>
      <Text variant="titleLarge" testID="compra-total">
        {`Total: ${formatearPrecio(total)}`}
      </Text>
      <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
        {`Comprada el ${formatearFecha(fechaCompra)}`}
      </Text>
    </View>
  );
}

function Contenido({ compra }) {
  return (
    <Pantalla scroll>
      <Estado compra={compra} />
      <Evento evento={compra.evento} />
      <Resumen compra={compra} />
      <Divider />
      <Text variant="titleMedium">Historial</Text>
      <LineaDeTiempo historial={compra.historial} />
    </Pantalla>
  );
}

export default function DetalleCompra() {
  return (
    <ConRecursoDeRuta
      obtener={obtenerCompra}
      iconoInexistente="ticket-outline"
      testIDInexistente="compra-inexistente"
    >
      {(compra) => <Contenido compra={compra} />}
    </ConRecursoDeRuta>
  );
}

const estilos = StyleSheet.create({
  estado: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  evento: { paddingTop: espaciado.md, gap: espaciado.xs },
  resumen: { gap: espaciado.xs },
});
