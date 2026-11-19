import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { radios } from "../tema/espaciado";

export function TarjetaPlana({ style, children, ...props }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        estilos.tarjeta,
        { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: radios.lg },
});
