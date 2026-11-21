import { Linking, StyleSheet, View } from "react-native";
import { Button, Icon, Text, useTheme } from "react-native-paper";
import { espaciado } from "../../tema/espaciado";
import { urlComoLlegar } from "../../utils/mapas";

export function ComoLlegar({ evento }) {
  const { colors } = useTheme();
  return (
    <View style={estilos.fila}>
      <Icon source="map-marker-outline" size={18} color={colors.onSurfaceVariant} />
      <Text
        variant="bodyMedium"
        style={[estilos.direccion, { color: colors.onSurfaceVariant }]}
        testID="evento-direccion"
      >
        {evento.direccion}
      </Text>
      <Button
        mode="outlined"
        compact
        icon="directions"
        onPress={() => Linking.openURL(urlComoLlegar(evento))}
        accessibilityHint="Abre Google Maps con la ruta al evento"
        testID="evento-como-llegar"
      >
        Cómo llegar
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: espaciado.sm },
  direccion: { flex: 1 },
});
