import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { espaciado, radios } from "../tema/espaciado";
import { useEstadoCompra } from "../tema/useEstadoCompra";

export function ChipEstado({ estado }) {
  const { etiqueta, fondo, texto } = useEstadoCompra(estado);
  return (
    <View
      style={[estilos.chip, { backgroundColor: fondo }]}
      accessible
      accessibilityLabel={`Estado: ${etiqueta}`}
      testID={`chip-estado-${estado}`}
    >
      <View
        style={[estilos.punto, { backgroundColor: texto }]}
        testID={`chip-estado-${estado}-punto`}
      />
      <Text variant="labelMedium" style={{ color: texto }}>
        {etiqueta}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: espaciado.xs + 2,
    paddingVertical: espaciado.xs,
    paddingHorizontal: espaciado.sm + 2,
    borderRadius: radios.pill,
  },
  punto: { width: 7, height: 7, borderRadius: radios.pill },
});
