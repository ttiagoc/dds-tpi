import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { router } from "expo-router";
import { BarraInferior } from "../../components/BarraInferior";
import { espaciado } from "../../tema/espaciado";
import { formatearPrecio } from "../../utils/formato";

function Accion({ evento }) {
  if (evento.finalizado) {
    return (
      <Button mode="contained" disabled testID="evento-finalizado">
        Evento finalizado
      </Button>
    );
  }
  const agotado = evento.tiposEntrada.every((tipo) => tipo.disponibles === 0);
  return (
    <Button
      mode="contained"
      disabled={agotado}
      onPress={() => router.push(`/eventos/${evento.id}/comprar`)}
      contentStyle={estilos.boton}
      testID="evento-comprar"
    >
      {agotado ? "Agotado" : "Comprar"}
    </Button>
  );
}

export function BarraComprar({ evento }) {
  const { colors } = useTheme();
  return (
    <BarraInferior testID="evento-barra-comprar">
      <View style={estilos.fila}>
        <View style={estilos.precio}>
          <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
            Desde
          </Text>
          <Text variant="titleLarge">{formatearPrecio(evento.precioDesde)}</Text>
        </View>
        <Accion evento={evento} />
      </View>
    </BarraInferior>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: espaciado.lg },
  precio: { flex: 1 },
  boton: { paddingHorizontal: espaciado.md, minHeight: 48 },
});
