import { Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { Cargando } from "../components/Cargando";
import { temaClaro, temaOscuro, navegacionClara, navegacionOscura } from "../tema/tema";

function Navegacion() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
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
        <Stack.Screen
          name="eventos/[id]/compras"
          options={{ headerShown: true, title: "Compras" }}
        />
        <Stack.Screen name="eventos/nuevo" options={{ headerShown: true, title: "Nuevo evento" }} />
      </Stack.Protected>
      <Stack.Protected guard={!!usuario}>
        <Stack.Screen name="eventos/[id]/index" options={{ headerShown: true, title: "Evento" }} />
        <Stack.Screen name="compras/[id]/index" options={{ headerShown: true, title: "Compra" }} />
        <Stack.Screen name="compras/[id]/chat" options={{ headerShown: true, title: "Chat" }} />
      </Stack.Protected>
      <Stack.Protected guard={rol === "COMPRADOR"}>
        <Stack.Screen
          name="eventos/[id]/comprar"
          options={{ headerShown: true, title: "Comprar" }}
        />
        <Stack.Screen
          name="compras/[id]/resenia"
          options={{ headerShown: true, title: "Reseñar" }}
        />
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
