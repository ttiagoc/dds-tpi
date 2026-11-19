import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { radios } from "../tema/espaciado";

const MUESCA = 20;
const MARGEN = 14;

export function Troquel({ testID }) {
  const { colors } = useTheme();
  const muesca = { backgroundColor: colors.background, borderColor: colors.outlineVariant };
  return (
    <View style={[estilos.troquel, { borderColor: colors.outlineVariant }]} testID={testID}>
      <View style={[estilos.muesca, estilos.izquierda, muesca]} />
      <View style={[estilos.muesca, estilos.derecha, muesca]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  troquel: { height: 0, borderTopWidth: 1.5, borderStyle: "dashed", marginHorizontal: MARGEN },
  muesca: {
    position: "absolute",
    top: -MUESCA / 2,
    width: MUESCA,
    height: MUESCA,
    borderRadius: radios.pill,
  },
  izquierda: { left: -MARGEN - MUESCA / 2 - 1, borderRightWidth: 1 },
  derecha: { right: -MARGEN - MUESCA / 2 - 1, borderLeftWidth: 1 },
});
