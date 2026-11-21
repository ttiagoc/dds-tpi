import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { IconButton, Text, useTheme } from "react-native-paper";
import { useAuth } from "../../auth/AuthContext";
import { ChipEstado } from "../../components/ChipEstado";
import { espaciado } from "../../tema/espaciado";

export function EncabezadoChat({ compra }) {
  const { usuario } = useAuth();
  const { colors } = useTheme();
  const esOrganizador = usuario?.rol === "ORGANIZADOR";
  const titulo = esOrganizador ? compra.comprador.nombre : compra.evento.nombre;
  const detalle = esOrganizador
    ? `${compra.evento.nombre} · #${compra.id}`
    : `Compra #${compra.id}`;
  return (
    <View style={estilos.encabezado} testID="chat-encabezado">
      <IconButton
        icon="chevron-left"
        size={28}
        style={estilos.volver}
        onPress={() => router.back()}
        accessibilityLabel="Volver"
        testID="chat-volver"
      />
      <View style={estilos.textos}>
        <Text variant="titleLarge" numberOfLines={1} accessibilityRole="header">
          {titulo}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }} numberOfLines={1}>
          {detalle}
        </Text>
      </View>
      <ChipEstado estado={compra.estado} />
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: { flexDirection: "row", alignItems: "center", gap: espaciado.sm },
  volver: { marginLeft: -espaciado.md, marginRight: 0 },
  textos: { flex: 1, gap: 2 },
});
