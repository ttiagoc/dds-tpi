import { StyleSheet, View } from "react-native";
import { Avatar, Button, SegmentedButtons, Text, useTheme } from "react-native-paper";
import { useAuth } from "../../auth/AuthContext";
import { EncabezadoPestania } from "../../components/EncabezadoPestania";
import { Pantalla } from "../../components/Pantalla";
import { espaciado } from "../../tema/espaciado";
import { usePreferenciaTema } from "../../tema/PreferenciaTemaContext";

const ROLES = { COMPRADOR: "Comprador", ORGANIZADOR: "Organizador" };

const OPCIONES_TEMA = [
  { value: "claro", label: "Claro", icon: "white-balance-sunny" },
  { value: "oscuro", label: "Oscuro", icon: "weather-night" },
  { value: "automatico", label: "Automático", icon: "theme-light-dark" },
].map((opcion) => ({ ...opcion, testID: `tema-${opcion.value}` }));

function Apariencia() {
  const { preferencia, elegir } = usePreferenciaTema();
  return (
    <View style={estilos.apariencia}>
      <Text variant="titleMedium">Apariencia</Text>
      <SegmentedButtons value={preferencia} onValueChange={elegir} buttons={OPCIONES_TEMA} />
    </View>
  );
}

export default function Perfil() {
  const { usuario, cerrarSesion } = useAuth();
  const { colors } = useTheme();
  if (!usuario) return null;
  const nombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ");
  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("");
  return (
    <Pantalla bordes={["top"]}>
      <EncabezadoPestania titulo="Perfil" />
      <View style={estilos.datos}>
        <Avatar.Text
          label={iniciales}
          size={72}
          style={{ backgroundColor: colors.primaryContainer }}
          color={colors.onPrimaryContainer}
        />
        <Text variant="titleLarge" testID="perfil-nombre">
          {nombre}
        </Text>
        <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }} testID="perfil-email">
          {usuario.email}
        </Text>
        <Text variant="labelLarge" testID="perfil-rol">
          {ROLES[usuario.rol]}
        </Text>
      </View>
      <Apariencia />
      <Button mode="outlined" icon="logout" onPress={cerrarSesion} testID="cerrar-sesion">
        Cerrar sesión
      </Button>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  datos: { alignItems: "center", gap: espaciado.sm, marginVertical: espaciado.xl },
  apariencia: { gap: espaciado.sm, marginBottom: espaciado.lg },
});
