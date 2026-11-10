import { StyleSheet, View } from "react-native";
import { Avatar, Button, Text } from "react-native-paper";
import { useAuth } from "../../auth/AuthContext";
import { Pantalla } from "../../components/Pantalla";
import { espaciado } from "../../tema/espaciado";

const ROLES = { COMPRADOR: "Comprador", ORGANIZADOR: "Organizador" };

export default function Perfil() {
  const { usuario, cerrarSesion } = useAuth();
  if (!usuario) return null;
  const nombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ");
  return (
    <Pantalla>
      <View style={estilos.datos}>
        <Avatar.Icon icon="account" size={72} />
        <Text variant="titleLarge" testID="perfil-nombre">
          {nombre}
        </Text>
        <Text variant="bodyMedium" testID="perfil-email">
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
