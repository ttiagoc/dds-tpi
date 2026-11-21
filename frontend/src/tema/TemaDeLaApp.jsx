import { ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import { usePreferenciaTema } from "./PreferenciaTemaContext";
import { esOscuro } from "./preferenciaTema";
import { navegacionClara, navegacionOscura, temaClaro, temaOscuro } from "./tema";

export function TemaDeLaApp({ children }) {
  const { preferencia } = usePreferenciaTema();
  const oscuro = esOscuro(preferencia, useColorScheme());
  return (
    <PaperProvider theme={oscuro ? temaOscuro : temaClaro}>
      <ThemeProvider value={oscuro ? navegacionOscura : navegacionClara}>
        <StatusBar style={oscuro ? "light" : "dark"} />
        {children}
      </ThemeProvider>
    </PaperProvider>
  );
}
