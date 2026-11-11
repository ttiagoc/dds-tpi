import { FlatList, StyleSheet } from "react-native";
import { Cargando } from "./Cargando";
import { ErrorCarga } from "./ErrorCarga";
import { PieDeLista } from "./PieDeLista";
import { useRefresco } from "../hooks/useListaPaginada";
import { espaciado } from "../tema/espaciado";

function SinItems({ lista, vacio }) {
  if (lista.cargando) return <Cargando />;
  if (lista.error) return <ErrorCarga mensaje={lista.error} onReintentar={lista.recargar} />;
  return vacio;
}

export function ListaPaginada({ lista, renderItem, encabezado, vacio, testID }) {
  const { refrescando, refrescar } = useRefresco(lista);
  return (
    <FlatList
      testID={testID}
      data={lista.items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => renderItem(item)}
      ListHeaderComponent={encabezado}
      ListEmptyComponent={<SinItems lista={lista} vacio={vacio} />}
      ListFooterComponent={<PieDeLista {...lista} onCargarMas={lista.cargarMas} />}
      refreshing={refrescando}
      onRefresh={refrescar}
      contentContainerStyle={estilos.lista}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const estilos = StyleSheet.create({
  lista: { flexGrow: 1, gap: espaciado.md },
});
