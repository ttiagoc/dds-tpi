import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { espaciado } from "../tema/espaciado";

export function SelectorCantidad({ valor, min = 1, max, onCambiar, testIDPrefijo = "cantidad" }) {
  return (
    <View style={estilos.selector}>
      <IconButton
        icon="minus"
        mode="outlined"
        disabled={valor <= min}
        onPress={() => onCambiar(valor - 1)}
        testID={`${testIDPrefijo}-menos`}
        accessibilityLabel="Restar uno"
      />
      <Text variant="titleLarge" style={estilos.valor} testID={`${testIDPrefijo}-valor`}>
        {valor}
      </Text>
      <IconButton
        icon="plus"
        mode="outlined"
        disabled={valor >= max}
        onPress={() => onCambiar(valor + 1)}
        testID={`${testIDPrefijo}-mas`}
        accessibilityLabel="Sumar uno"
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  selector: { flexDirection: "row", alignItems: "center", gap: espaciado.sm },
  valor: { minWidth: espaciado.xl, textAlign: "center" },
});
