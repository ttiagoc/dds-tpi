import { StyleSheet, View } from "react-native";
import { Chip, Text } from "react-native-paper";
import { espaciado } from "../../tema/espaciado";

const CONTRASENIA_DEMO = "Demo1234!";

const USUARIOS_DEMO = [
  { email: "ana@aiticket.com", etiqueta: "Ana (compradora)" },
  { email: "bruno@aiticket.com", etiqueta: "Bruno (comprador)" },
  { email: "fenix@aiticket.com", etiqueta: "Fénix (organizador)" },
  { email: "konex@aiticket.com", etiqueta: "Konex (organizador)" },
];

export function UsuariosDemo({ onElegir }) {
  return (
    <View style={estilos.bloque}>
      <Text variant="labelLarge">Usuarios de prueba</Text>
      <View style={estilos.chips}>
        {USUARIOS_DEMO.map(({ email, etiqueta }) => (
          <Chip
            key={email}
            icon="account-outline"
            onPress={() => onElegir({ email, password: CONTRASENIA_DEMO })}
            testID={`login-demo-${email}`}
          >
            {etiqueta}
          </Chip>
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: espaciado.sm, marginTop: espaciado.xl },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: espaciado.sm },
});
