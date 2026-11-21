import { ScrollView, StyleSheet } from "react-native";
import { ActivityIndicator, List, Text, useTheme } from "react-native-paper";
import { ErrorEnLinea } from "../../components/ErrorEnLinea";
import { espaciado, radios } from "../../tema/espaciado";

const ALTO_MAXIMO = 240;
const MARGEN_FINAL = 40;

const cercaDelFinal = ({ layoutMeasurement, contentOffset, contentSize }) =>
  layoutMeasurement.height + contentOffset.y >= contentSize.height - MARGEN_FINAL;

function Contenido({ lista, onElegir }) {
  const { colors } = useTheme();
  if (lista.cargando)
    return <ActivityIndicator style={estilos.aviso} accessibilityLabel="Cargando categorías" />;
  if (lista.error)
    return (
      <ErrorEnLinea mensaje={lista.error} onReintentar={lista.recargar} testID="categorias-error" />
    );
  if (lista.items.length === 0)
    return (
      <Text style={[estilos.aviso, { color: colors.onSurfaceVariant }]} testID="categorias-vacio">
        No hay categorías con ese nombre
      </Text>
    );
  return lista.items.map((opcion) => (
    <List.Item
      key={opcion.id}
      title={opcion.nombre}
      onPress={() => onElegir(opcion)}
      accessibilityRole="button"
      accessibilityLabel={opcion.nombre}
      testID={`categoria-${opcion.id}`}
    />
  ));
}

export function ListaDeCategorias({ lista, onElegir }) {
  const { colors } = useTheme();
  const alScrollear = ({ nativeEvent }) => {
    if (cercaDelFinal(nativeEvent) && lista.hayMas && !lista.cargandoMas) lista.cargarMas();
  };
  return (
    <ScrollView
      style={[
        estilos.lista,
        { borderColor: colors.outlineVariant, backgroundColor: colors.surface },
      ]}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      onScroll={alScrollear}
      scrollEventThrottle={100}
      accessibilityRole="list"
      testID="categorias-lista"
    >
      <Contenido lista={lista} onElegir={onElegir} />
      {lista.cargandoMas && (
        <ActivityIndicator style={estilos.aviso} testID="categorias-cargando-mas" />
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  lista: { maxHeight: ALTO_MAXIMO, borderWidth: 1, borderRadius: radios.md },
  aviso: { padding: espaciado.md },
});
