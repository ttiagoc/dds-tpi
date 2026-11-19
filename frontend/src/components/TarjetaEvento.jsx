import { StyleSheet, View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import { BloqueFecha } from "./BloqueFecha";
import { ImagenEvento } from "./ImagenEvento";
import { PuntajeOrganizador } from "./PuntajeOrganizador";
import { espaciado, radios } from "../tema/espaciado";
import { formatearFecha, formatearPrecio, partesDelBloqueFecha } from "../utils/formato";

export function TarjetaEvento({ evento, onPress }) {
  const { colors } = useTheme();
  const { id, nombre, fecha, lugar, precioDesde, imagen, organizador } = evento;
  return (
    <TouchableRipple
      onPress={onPress}
      borderless
      style={estilos.tarjeta}
      testID={`tarjeta-evento-${id}`}
      accessibilityRole="button"
      accessibilityLabel={`${nombre}, ${formatearFecha(fecha)}, ${lugar}, desde ${formatearPrecio(precioDesde)}`}
    >
      <View style={estilos.contenido}>
        <View style={estilos.imagen}>
          <ImagenEvento uri={imagen} nombre={nombre} />
        </View>
        <View style={estilos.datos}>
          <BloqueFecha fecha={fecha} />
          <View style={estilos.texto}>
            <Text variant="titleMedium">{nombre}</Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              {`${partesDelBloqueFecha(fecha).hora} · ${lugar}`}
            </Text>
            <Text variant="titleSmall">{`Desde ${formatearPrecio(precioDesde)}`}</Text>
            <PuntajeOrganizador organizador={organizador} />
          </View>
        </View>
      </View>
    </TouchableRipple>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderRadius: radios.lg },
  contenido: { gap: espaciado.md, paddingBottom: espaciado.xs },
  imagen: { borderRadius: radios.lg, overflow: "hidden" },
  datos: { flexDirection: "row", gap: espaciado.md + 2, alignItems: "flex-start" },
  texto: { flex: 1, gap: 3 },
});
