import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { espaciado, ANCHO_MAXIMO } from "../tema/espaciado";

function Contenido({ children, scroll, testID }) {
  const contenido = <View style={estilos.contenido}>{children}</View>;
  if (!scroll) {
    return (
      <View style={estilos.pantalla} testID={testID}>
        {contenido}
      </View>
    );
  }
  return (
    <ScrollView
      style={estilos.pantalla}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      testID={testID}
    >
      {contenido}
    </ScrollView>
  );
}

export function Pantalla({ bordes = [], ...props }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={bordes} style={[estilos.pantalla, { backgroundColor: colors.background }]}>
      <Contenido {...props} />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: {
    flexGrow: 1,
    width: "100%",
    maxWidth: ANCHO_MAXIMO,
    alignSelf: "center",
    padding: espaciado.lg,
    gap: espaciado.md,
  },
});
