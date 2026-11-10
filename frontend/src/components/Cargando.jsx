import { StyleSheet, View } from "react-native";
import { ActivityIndicator, useTheme } from "react-native-paper";

export function Cargando() {
  const { colors } = useTheme();
  return (
    <View style={[estilos.centro, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" accessibilityLabel="Cargando" testID="cargando" />
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center" },
});
