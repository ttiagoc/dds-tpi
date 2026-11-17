import { StyleSheet, View } from "react-native";
import { Icon, Text, useTheme } from "react-native-paper";
import { espaciado } from "../tema/espaciado";

export function Logo() {
  const { colors } = useTheme();
  return (
    <View
      style={estilos.logo}
      accessible
      accessibilityRole="header"
      accessibilityLabel="AI Ticket It"
      testID="logo"
    >
      <Icon source="ticket-confirmation" size={28} color={colors.primary} />
      <Text variant="titleLarge">
        <Text variant="titleLarge" style={{ color: colors.primary }}>
          AI
        </Text>
        {" Ticket It"}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  logo: { flexDirection: "row", alignItems: "center", gap: espaciado.sm },
});
