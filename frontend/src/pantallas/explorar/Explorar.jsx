import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Searchbar } from "react-native-paper";
import { router } from "expo-router";
import { Pantalla } from "../../components/Pantalla";
import { Cargando } from "../../components/Cargando";
import { ErrorCarga } from "../../components/ErrorCarga";
import { EstadoVacio } from "../../components/EstadoVacio";
import { TarjetaEvento } from "../../components/TarjetaEvento";
import { useDebounce } from "../../hooks/useDebounce";
import { espaciado } from "../../tema/espaciado";
import { ChipsCategorias } from "./ChipsCategorias";
import { MenuOrden, OPCIONES_ORDEN } from "./MenuOrden";
import { PieDeLista } from "./PieDeLista";
import { useEventosPaginados } from "./useEventosPaginados";

const DEMORA_BUSQUEDA = 300;

function useFiltros() {
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState(null);
  const [orden, setOrden] = useState(OPCIONES_ORDEN[0]);
  const demorado = useDebounce(texto.trim(), DEMORA_BUSQUEDA);
  const q = texto.trim() === "" ? "" : demorado;
  const criterio = {
    q: q || undefined,
    categoria: categoria ?? undefined,
    ordenarPor: orden.ordenarPor,
    orden: orden.orden,
  };
  const limpiar = () => {
    setTexto("");
    setCategoria(null);
  };
  const hayFiltros = texto.trim() !== "" || categoria != null;
  return {
    texto,
    setTexto,
    categoria,
    setCategoria,
    orden,
    setOrden,
    criterio,
    limpiar,
    hayFiltros,
  };
}

function Filtros({ filtros }) {
  return (
    <View style={estilos.filtros}>
      <Searchbar
        placeholder="Buscar eventos"
        value={filtros.texto}
        onChangeText={filtros.setTexto}
        testID="buscador"
        accessibilityLabel="Buscar eventos"
      />
      <ChipsCategorias seleccionada={filtros.categoria} onElegir={filtros.setCategoria} />
      <View style={estilos.orden}>
        <MenuOrden seleccionada={filtros.orden} onElegir={filtros.setOrden} />
      </View>
    </View>
  );
}

function SinEventos({ lista, filtros }) {
  if (lista.cargando) return <Cargando />;
  if (lista.error) return <ErrorCarga mensaje={lista.error} onReintentar={lista.recargar} />;
  const accion = filtros.hayFiltros
    ? { etiqueta: "Limpiar filtros", onPress: filtros.limpiar, testID: "limpiar-filtros" }
    : undefined;
  return (
    <EstadoVacio
      icono="calendar-search"
      texto="No encontramos eventos con esos filtros"
      accion={accion}
      testID="sin-eventos"
    />
  );
}

function useRefresco(lista) {
  const [refrescando, setRefrescando] = useState(false);
  if (refrescando && !lista.cargando) setRefrescando(false);
  const refrescar = () => {
    setRefrescando(true);
    lista.recargar();
  };
  return { refrescando, refrescar };
}

export default function Explorar() {
  const filtros = useFiltros();
  const lista = useEventosPaginados(filtros.criterio);
  const { refrescando, refrescar } = useRefresco(lista);
  const mostrarEventos = !lista.cargando || refrescando;
  return (
    <Pantalla>
      <FlatList
        testID="lista-eventos"
        data={mostrarEventos ? lista.eventos : []}
        keyExtractor={(evento) => String(evento.id)}
        renderItem={({ item }) => (
          <TarjetaEvento evento={item} onPress={() => router.push(`/eventos/${item.id}`)} />
        )}
        ListHeaderComponent={<Filtros filtros={filtros} />}
        ListEmptyComponent={<SinEventos lista={lista} filtros={filtros} />}
        ListFooterComponent={<PieDeLista {...lista} onCargarMas={lista.cargarMas} />}
        refreshing={refrescando}
        onRefresh={refrescar}
        contentContainerStyle={estilos.lista}
        keyboardShouldPersistTaps="handled"
      />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  lista: { flexGrow: 1, gap: espaciado.md },
  filtros: { gap: espaciado.md },
  orden: { alignItems: "flex-start" },
});
