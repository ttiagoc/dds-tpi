import { ScrollView, StyleSheet } from "react-native";
import { Chip } from "react-native-paper";
import { espaciado } from "../tema/espaciado";

function ChipFiltro({ seleccionado, onPress, testID, children }) {
  return (
    <Chip
      mode={seleccionado ? "flat" : "outlined"}
      selected={seleccionado}
      showSelectedOverlay
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

const estilos = StyleSheet.create({ fila: { gap: espaciado.sm } });
