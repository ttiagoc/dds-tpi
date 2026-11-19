import { StyleSheet, View } from "react-native";
import { TarjetaPlana } from "../../components/TarjetaPlana";
import { Chip, Text, useTheme } from "react-native-paper";
import { espaciado } from "../../tema/espaciado";
import { formatearPrecio, textoDisponibilidad } from "../../utils/formato";

function Disponibilidad({ disponibles }) {
  const { colors } = useTheme();
  if (disponibles === 0) {
    return (
      <Chip compact icon="close-circle-outline">
        {textoDisponibilidad(disponibles)}
      </Chip>
    );
  }
  return (
    <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
      {textoDisponibilidad(disponibles)}
    </Text>
  );
}

function TipoEntrada({ tipo }) {
  const { colors } = useTheme();
  return (
    <TarjetaPlana style={estilos.tipo} testID={`tipo-entrada-${tipo.id}`}>
      <View style={estilos.datos}>
        <Text variant="titleSmall">{tipo.nombre}</Text>
        {!!tipo.descripcion && (
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            {tipo.descripcion}
          </Text>
        )}
      </View>
      <View style={estilos.precio}>
        <Text variant="titleSmall">{formatearPrecio(tipo.precio)}</Text>
        <Disponibilidad disponibles={tipo.disponibles} />
      </View>
    </TarjetaPlana>
  );
}

export function TiposEntrada({ tipos }) {
  return (
    <View style={estilos.lista}>
      <Text variant="titleMedium">Entradas</Text>
      {tipos.map((tipo) => (
        <TipoEntrada key={tipo.id} tipo={tipo} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espaciado.sm },
  tipo: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaciado.md,
    padding: espaciado.md + 2,
  },
  datos: { flex: 1, gap: espaciado.xs },
  precio: { alignItems: "flex-end", gap: espaciado.xs },
});
