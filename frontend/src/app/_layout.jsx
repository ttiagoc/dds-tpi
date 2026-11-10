import { Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { temaClaro, temaOscuro, navegacionClara, navegacionOscura } from "../tema/tema";

function Navegacion() {
  const { usuario } = useAuth();
  const rol = usuario?.rol;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="(auth)/login" />
      </Stack.Protected>
      <Stack.Protected guard={rol === "COMPRADOR"}>
        <Stack.Screen name="(comprador)" />
      </Stack.Protected>
      <Stack.Protected guard={rol === "ORGANIZADOR"}>
        <Stack.Screen name="(organizador)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const oscuro = useColorScheme() === "dark";
  return (
    <PaperProvider theme={oscuro ? temaOscuro : temaClaro}>
      <ThemeProvider value={oscuro ? navegacionOscura : navegacionClara}>
        <AuthProvider>
          <StatusBar style="auto" />
          <Navegacion />
        </AuthProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}
