import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Estrellas } from "./Estrellas";
import { espaciado } from "../tema/espaciado";
import { formatearPuntaje } from "../utils/formato";

export function PuntajeOrganizador({ organizador }) {
  const { colors } = useTheme();
  const { nombre, puntajePromedio } = organizador;
  const secundario = { color: colors.onSurfaceVariant };
  return (
    <View style={estilos.fila}>
      <Text variant="bodyMedium" style={secundario}>
        {nombre}
      </Text>
      {puntajePromedio == null ? (
        <Text variant="bodySmall" style={secundario}>
          Sin reseñas
        </Text>
      ) : (
        <>
          <Estrellas valor={puntajePromedio} />
          <Text variant="bodySmall" style={secundario}>
            {formatearPuntaje(puntajePromedio)}
          </Text>
        </>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: espaciado.xs },
});
