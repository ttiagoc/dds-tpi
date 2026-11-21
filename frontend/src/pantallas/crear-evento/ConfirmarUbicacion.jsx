import { StyleSheet, View } from "react-native";
import { Button, Icon, Text, useTheme } from "react-native-paper";
import { TarjetaPlana } from "../../components/TarjetaPlana";
import { espaciado } from "../../tema/espaciado";
import { MapaUbicacion } from "./MapaUbicacion";

function Confirmada() {
  const { colors } = useTheme();
  return (
    <View style={estilos.fila} testID="ubicacion-confirmada">
      <Icon source="check-circle" size={20} color={colors.primary} />
      <Text variant="labelLarge">Ubicación confirmada</Text>
    </View>
  );
}

export function ConfirmarUbicacion({ ubicacion, onConfirmar, deshabilitado }) {
  return (
    <TarjetaPlana style={estilos.tarjeta}>
      <MapaUbicacion ubicacion={ubicacion} />
      <Text variant="bodyMedium" testID="ubicacion-direccion">
        {ubicacion.direccion}
      </Text>
      {ubicacion.confirmada ? (
        <Confirmada />
      ) : (
        <Button
          mode="contained-tonal"
          icon="map-marker-check"
          onPress={onConfirmar}
          disabled={deshabilitado}
          testID="ubicacion-confirmar"
        >
          Sí, es acá
        </Button>
      )}
    </TarjetaPlana>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { gap: espaciado.sm, padding: espaciado.md },
  fila: { flexDirection: "row", alignItems: "center", gap: espaciado.sm },
});
