import { StyleSheet, View } from "react-native";
import { Avatar, Button, Text, useTheme } from "react-native-paper";
import { useAuth } from "../../auth/AuthContext";
import { EncabezadoPestania } from "../../components/EncabezadoPestania";
import { Pantalla } from "../../components/Pantalla";
import { espaciado } from "../../tema/espaciado";

const ROLES = { COMPRADOR: "Comprador", ORGANIZADOR: "Organizador" };

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
      <Button mode="outlined" icon="logout" onPress={cerrarSesion} testID="cerrar-sesion">
        Cerrar sesión
      </Button>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  datos: { alignItems: "center", gap: espaciado.sm, marginVertical: espaciado.xl },
});
