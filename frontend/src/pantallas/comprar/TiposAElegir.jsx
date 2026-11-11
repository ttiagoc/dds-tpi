import { StyleSheet, View } from "react-native";
import { RadioButton, Text } from "react-native-paper";
import { espaciado } from "../../tema/espaciado";
import { formatearPrecio, textoDisponibilidad } from "../../utils/formato";

const etiqueta = ({ nombre, precio, disponibles }) =>
  `${nombre} · ${formatearPrecio(precio)} · ${textoDisponibilidad(disponibles)}`;

export function TiposAElegir({ tipos, elegido, onElegir }) {
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
            testID={`tipo-${tipo.id}`}
          />
        ))}
      </RadioButton.Group>
    </View>
  );
}

const estilos = StyleSheet.create({
  tipos: { gap: espaciado.xs },
});
