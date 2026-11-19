import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { espaciado, radios } from "../../tema/espaciado";
import { partesDelBloqueFecha } from "../../utils/formato";

export function Burbuja({ mensaje, propia }) {
  const { colors } = useTheme();
  const fondo = propia ? colors.onSurface : colors.surface;
  const color = propia ? colors.surface : colors.onSurface;
  return (
    <View
      style={[
        estilos.burbuja,
        propia ? estilos.propia : [estilos.ajena, { borderColor: colors.outlineVariant }],
        { backgroundColor: fondo },
      ]}
      testID={`mensaje-${mensaje.id}`}
    >
      {!propia && (
        <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
          {mensaje.usuario.nombre}
        </Text>
      )}
      <Text variant="bodyMedium" style={{ color }}>
        {mensaje.mensaje}
      </Text>
      <Text variant="labelSmall" style={[estilos.hora, { color }]}>
        {partesDelBloqueFecha(mensaje.enviado).hora}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  burbuja: {
    maxWidth: "80%",
    paddingVertical: espaciado.sm,
    paddingHorizontal: espaciado.md,
    borderRadius: radios.lg,
    gap: espaciado.xs,
  },
  propia: { alignSelf: "flex-end", borderBottomRightRadius: radios.sm },
  ajena: { alignSelf: "flex-start", borderBottomLeftRadius: radios.sm, borderWidth: 1 },
  hora: { alignSelf: "flex-end", opacity: 0.8 },
});
