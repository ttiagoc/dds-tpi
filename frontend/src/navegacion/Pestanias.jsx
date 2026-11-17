import { Tabs } from "expo-router";
import { Icon, useTheme } from "react-native-paper";
import { Logo } from "../components/Logo";

function opcionesDe(colors) {
  return {
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.onSurfaceVariant,
    tabBarStyle: { backgroundColor: colors.surface },
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.onSurface,
  };
}

export function Pestanias({ pestanias }) {
  const { colors } = useTheme();
  return (
    <Tabs screenOptions={opcionesDe(colors)}>
      {pestanias.map(({ ruta, titulo, icono, conLogo, testID = `tab-${ruta}` }) => (
        <Tabs.Screen
          key={ruta}
          name={ruta}
          options={{
            title: titulo,
            tabBarIcon: ({ color, size }) => <Icon source={icono} color={color} size={size} />,
            tabBarButtonTestID: testID,
            tabBarAccessibilityLabel: titulo,
            ...(conLogo && { headerTitle: () => <Logo />, headerTitleAlign: "left" }),
          }}
        />
      ))}
    </Tabs>
  );
}
