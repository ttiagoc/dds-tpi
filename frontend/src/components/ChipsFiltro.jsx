import { FlatList, StyleSheet } from "react-native";
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

const TODAS = { valor: null, etiqueta: "Todas" };

export function ChipsFiltro({ opciones, seleccionada, onElegir, prefijoTestID, alLlegarAlFinal }) {
  return (
    <FlatList
      horizontal
      testID={`${prefijoTestID}-fila`}
      data={[TODAS, ...opciones]}
      keyExtractor={({ valor }) => String(valor)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.fila}
      onEndReached={alLlegarAlFinal}
      onEndReachedThreshold={0.5}
      renderItem={({ item: { valor, etiqueta } }) => (
        <ChipFiltro
          seleccionado={seleccionada === valor || (valor === null && seleccionada == null)}
          onPress={() => onElegir(valor === null || seleccionada === valor ? null : valor)}
          testID={`${prefijoTestID}-${valor === null ? "todas" : valor}`}
        >
          {etiqueta}
        </ChipFiltro>
      )}
    />
  );
}

const estilos = StyleSheet.create({
  fila: { gap: espaciado.sm },
  chip: { borderRadius: radios.pill },
});
