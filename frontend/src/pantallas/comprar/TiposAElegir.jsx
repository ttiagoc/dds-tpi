import { StyleSheet, View } from "react-native";
import { RadioButton, Text, useTheme } from "react-native-paper";
import { espaciado, radios } from "../../tema/espaciado";
import { formatearPrecio, textoDisponibilidad } from "../../utils/formato";

const etiqueta = ({ nombre, precio, disponibles }) =>
  `${nombre} · ${formatearPrecio(precio)} · ${textoDisponibilidad(disponibles)}`;

export function TiposAElegir({ tipos, elegido, onElegir }) {
  const { colors } = useTheme();
  const borde = (tipo) =>
    tipo.id === elegido
      ? { borderColor: colors.onSurface, borderWidth: 2 }
      : { borderColor: colors.outlineVariant, borderWidth: 1 };
  return (
    <View style={estilos.tipos}>
      <Text variant="titleMedium">Elegí tu entrada</Text>
      <RadioButton.Group value={String(elegido)} onValueChange={(valor) => onElegir(Number(valor))}>
        {tipos.map((tipo) => (
          <RadioButton.Item
            key={tipo.id}
            value={String(tipo.id)}
            label={etiqueta(tipo)}
            disabled={tipo.disponibles === 0}
            style={[estilos.tipo, { backgroundColor: colors.surface }, borde(tipo)]}
            color={colors.onSurface}
            testID={`tipo-${tipo.id}`}
          />
        ))}
      </RadioButton.Group>
    </View>
  );
}

const estilos = StyleSheet.create({
  tipos: { gap: espaciado.sm },
  tipo: { borderRadius: radios.lg },
});
