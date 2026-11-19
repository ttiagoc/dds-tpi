import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { espaciado, ANCHO_MAXIMO } from "../tema/espaciado";

export function BarraInferior({ children, testID }) {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      style={[
        estilos.barra,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outlineVariant,
          paddingBottom: espaciado.md + bottom,
        },
      ]}
      testID={testID}
    >
      <View style={estilos.contenido}>{children}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: { borderTopWidth: 1, paddingTop: espaciado.md, paddingHorizontal: espaciado.lg },
  contenido: {
    gap: espaciado.sm,
    width: "100%",
    maxWidth: ANCHO_MAXIMO,
    alignSelf: "center",
  },
});
