import { ScrollView, StyleSheet } from "react-native";
import { Chip, useTheme } from "react-native-paper";
import { espaciado, radios } from "../tema/espaciado";

function ChipFiltro({ seleccionado, onPress, testID, children }) {
  const { colors } = useTheme();
  const fondo = seleccionado ? colors.onSurface : colors.surface;
  const texto = seleccionado ? colors.surface : colors.onSurface;
  return (
    <Chip
      mode="outlined"
      selected={seleccionado}
      showSelectedCheck={false}
      style={[
        estilos.chip,
        { backgroundColor: fondo, borderColor: seleccionado ? fondo : colors.outlineVariant },
      ]}
      textStyle={{ color: texto }}
      onPress={onPress}
      testID={testID}
      accessibilityState={{ selected: seleccionado }}
    >
      {children}
    </Chip>
  );
}

export function ChipsFiltro({ opciones, seleccionada, onElegir, prefijoTestID }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.fila}
    >
      <ChipFiltro
        seleccionado={seleccionada == null}
        onPress={() => onElegir(null)}
        testID={`${prefijoTestID}-todas`}
      >
        Todas
      </ChipFiltro>
      {opciones.map(({ valor, etiqueta }) => (
        <ChipFiltro
          key={valor}
          seleccionado={seleccionada === valor}
          onPress={() => onElegir(seleccionada === valor ? null : valor)}
          testID={`${prefijoTestID}-${valor}`}
        >
          {etiqueta}
        </ChipFiltro>
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fila: { gap: espaciado.sm },
  chip: { borderRadius: radios.pill },
});
