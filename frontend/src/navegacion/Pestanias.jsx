import { Tabs } from "expo-router";
import { Icon, useTheme } from "react-native-paper";
import { Logo } from "../components/Logo";

function opcionesDe({ colors, fonts }) {
  return {
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.onSurfaceVariant,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.outlineVariant,
      borderTopWidth: 1,
      elevation: 0,
      shadowOpacity: 0,
    },
    tabBarLabelStyle: { fontFamily: fonts.labelSmall.fontFamily },
    tabBarBadgeStyle: {
      backgroundColor: colors.primary,
      color: colors.onPrimary,
      ...fonts.labelSmall,
    },
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerTintColor: colors.onSurface,
    headerTitleStyle: fonts.titleLarge,
  };
}

export function Pestanias({ pestanias, badge }) {
  const tema = useTheme();
  return (
    <Tabs screenOptions={opcionesDe(tema)}>
      {pestanias.map(({ ruta, titulo, icono, conLogo, conBadge, testID = `tab-${ruta}` }) => (
        <Tabs.Screen
          key={ruta}
          name={ruta}
          options={{
            title: titulo,
            tabBarIcon: ({ color, size }) => <Icon source={icono} color={color} size={size} />,
            tabBarButtonTestID: testID,
            tabBarAccessibilityLabel: titulo,
            tabBarBadge: conBadge ? badge : undefined,
            ...(conLogo && { headerTitle: () => <Logo />, headerTitleAlign: "left" }),
          }}
        />
      ))}
    </Tabs>
  );
}
