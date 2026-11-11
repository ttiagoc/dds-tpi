import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { FechaYLugar } from "./FechaYLugar";
import { espaciado } from "../tema/espaciado";

export function EncabezadoEvento({ evento }) {
  return (
    <View style={estilos.encabezado}>
      <Text variant="headlineSmall">{evento.nombre}</Text>
      <FechaYLugar fecha={evento.fecha} lugar={evento.lugar} />
    </View>
  );
}

const estilos = StyleSheet.create({ encabezado: { gap: espaciado.xs } });
