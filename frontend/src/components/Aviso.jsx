import { StyleSheet, View } from "react-native";
import { Button, Icon, Text, useTheme } from "react-native-paper";
import { espaciado } from "../tema/espaciado";

export function Aviso({ icono, texto, color, accion, testID }) {
  const { colors } = useTheme();
  return (
    <View style={estilos.aviso} testID={testID}>
      <Icon source={icono} size={48} color={color ?? colors.onSurfaceVariant} />
      <Text variant="bodyLarge" style={[estilos.texto, { color: colors.onSurface }]}>
        {texto}
      </Text>
      {accion && (
        <Button mode="contained-tonal" onPress={accion.onPress} testID={accion.testID}>
          {accion.etiqueta}
        </Button>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: espaciado.md,
    padding: espaciado.xl,
  },
  texto: { textAlign: "center" },
});
