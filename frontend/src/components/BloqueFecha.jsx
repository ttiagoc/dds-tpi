import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { espaciado, radios } from "../tema/espaciado";
import { partesDelBloqueFecha } from "../utils/formato";

export function BloqueFecha({ fecha }) {
  const { colors } = useTheme();
  const { diaSemana, dia, mes } = partesDelBloqueFecha(fecha);
  return (
    <View
      style={[
        estilos.bloque,
        { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
      ]}
      testID="bloque-fecha"
    >
      <Text variant="labelSmall" style={{ color: colors.primary }}>
        {diaSemana}
      </Text>
      <Text variant="titleLarge">{dia}</Text>
      <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
        {mes}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: {
    width: 52,
    alignItems: "center",
    paddingVertical: espaciado.xs + 2,
    borderWidth: 1,
    borderRadius: radios.md,
  },
});
