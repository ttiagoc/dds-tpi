import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { Cargando } from "../components/Cargando";
import { NoLeidosProvider } from "../mensajes/NoLeidosContext";
import { PreferenciaTemaProvider } from "../tema/PreferenciaTemaContext";
import { TemaDeLaApp } from "../tema/TemaDeLaApp";

const conEncabezado = (name, title) => (
  <Stack.Screen key={name} name={name} options={{ headerShown: true, title }} />
);

function Navegacion() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  const rol = usuario?.rol;
  return (
    <Stack screenOptions={{ headerShown: false, headerBackButtonDisplayMode: "minimal" }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="(auth)/login" />
      </Stack.Protected>
      <Stack.Protected guard={rol === "COMPRADOR"}>
        <Stack.Screen name="(comprador)" />
      </Stack.Protected>
      <Stack.Protected guard={rol === "ORGANIZADOR"}>
        <Stack.Screen name="(organizador)" />
        {conEncabezado("eventos/[id]/compras", "Compras")}
        {conEncabezado("eventos/[id]/escanear", "Escanear entrada")}
        {conEncabezado("eventos/nuevo", "Nuevo evento")}
      </Stack.Protected>
      <Stack.Protected guard={!!usuario}>
        {conEncabezado("eventos/[id]/index", "Evento")}
        {conEncabezado("compras/[id]/index", "Compra")}
        <Stack.Screen name="compras/[id]/chat" options={{ title: "Chat" }} />
      </Stack.Protected>
      <Stack.Protected guard={rol === "COMPRADOR"}>
        {conEncabezado("eventos/[id]/comprar", "Comprar")}
        {conEncabezado("compras/[id]/resenia", "Reseñar")}
      </Stack.Protected>
    </Stack>
  );
}

SplashScreen.preventAutoHideAsync().catch(() => {});

function useFuentes() {
  const [cargadas, error] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const listas = cargadas || !!error;
  useEffect(() => {
    if (listas) SplashScreen.hideAsync().catch(() => {});
  }, [listas]);
  return listas;
}

export default function RootLayout() {
  const fuentesListas = useFuentes();
  if (!fuentesListas) return null;
  return (
    <PreferenciaTemaProvider>
      <TemaDeLaApp>
        <AuthProvider>
          <NoLeidosProvider>
            <Navegacion />
          </NoLeidosProvider>
        </AuthProvider>
      </TemaDeLaApp>
    </PreferenciaTemaProvider>
  );
}
