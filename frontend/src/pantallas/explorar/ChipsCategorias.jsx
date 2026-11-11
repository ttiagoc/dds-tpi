import { useCallback } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Chip } from "react-native-paper";
import { listarCategorias } from "../../api/categoriasApi";
import { useCargar } from "../../hooks/useCargar";
import { espaciado } from "../../tema/espaciado";

function ChipCategoria({ seleccionado, onPress, testID, children }) {
  return (
    <Chip
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

export function ChipsCategorias({ seleccionada, onElegir }) {
  const cargar = useCallback(() => listarCategorias(), []);
  const { datos: categorias } = useCargar(cargar);
  if (!categorias?.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.fila}
    >
      <ChipCategoria
        seleccionado={seleccionada == null}
        onPress={() => onElegir(null)}
        testID="chip-categoria-todas"
      >
        Todas
      </ChipCategoria>
      {categorias.map(({ id, nombre }) => (
        <ChipCategoria
          key={id}
          seleccionado={seleccionada === id}
          onPress={() => onElegir(seleccionada === id ? null : id)}
          testID={`chip-categoria-${id}`}
        >
          {nombre}
        </ChipCategoria>
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({ fila: { gap: espaciado.sm } });
