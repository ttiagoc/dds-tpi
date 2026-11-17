import { StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { FechaYLugar } from "./FechaYLugar";
import { ImagenEvento } from "./ImagenEvento";
import { PuntajeOrganizador } from "./PuntajeOrganizador";
import { espaciado, radios } from "../tema/espaciado";
import { formatearFecha, formatearPrecio } from "../utils/formato";

export function TarjetaEvento({ evento, onPress }) {
  const { colors } = useTheme();
  const { id, nombre, fecha, lugar, precioDesde, imagen, organizador } = evento;
  return (
    <Card
      mode="elevated"
      onPress={onPress}
      testID={`tarjeta-evento-${id}`}
      accessibilityLabel={`${nombre}, ${formatearFecha(fecha)}, ${lugar}, desde ${formatearPrecio(precioDesde)}`}
    >
      <View style={estilos.recorte}>
        <ImagenEvento uri={imagen} nombre={nombre} />
        <Card.Content style={estilos.contenido}>
          <Text variant="titleMedium">{nombre}</Text>
          <FechaYLugar fecha={fecha} lugar={lugar} />
          <View style={estilos.pie}>
            <Text variant="titleSmall" style={{ color: colors.primary }}>
              {`Desde ${formatearPrecio(precioDesde)}`}
            </Text>
            <PuntajeOrganizador organizador={organizador} />
          </View>
        </Card.Content>
      </View>
    </Card>
  );
}

const estilos = StyleSheet.create({
  recorte: { overflow: "hidden", borderRadius: radios.md },
  contenido: { paddingTop: espaciado.md, gap: espaciado.xs },
  pie: { gap: espaciado.xs, marginTop: espaciado.xs },
});
