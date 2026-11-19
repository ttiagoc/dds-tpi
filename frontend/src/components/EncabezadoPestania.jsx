import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Logo } from "./Logo";
import { espaciado } from "../tema/espaciado";

export function EncabezadoPestania({ titulo, saludo, conLogo = false }) {
  const { colors } = useTheme();
  return (
    <View style={estilos.encabezado}>
      {conLogo && <Logo />}
      <View>
        {saludo && (
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            {saludo}
          </Text>
        )}
        <Text variant="headlineMedium" accessibilityRole="header" testID="titulo-pestania">
          {titulo}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: { gap: espaciado.lg, paddingTop: espaciado.sm },
});
