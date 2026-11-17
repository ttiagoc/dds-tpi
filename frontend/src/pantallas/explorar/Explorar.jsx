import { useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import { Searchbar, Text, useTheme } from "react-native-paper";
import { router } from "expo-router";
import { buscarEventos } from "../../api/eventosApi";
import { useAuth } from "../../auth/AuthContext";
import { Pantalla } from "../../components/Pantalla";
import { EstadoVacio } from "../../components/EstadoVacio";
import { ListaPaginada } from "../../components/ListaPaginada";
import { TarjetaEvento } from "../../components/TarjetaEvento";
import { useDebounce } from "../../hooks/useDebounce";
import { paginaDe, useListaPaginada } from "../../hooks/useListaPaginada";
import { espaciado } from "../../tema/espaciado";
import { ChipsCategorias } from "./ChipsCategorias";
import { MenuOrden, OPCIONES_ORDEN } from "./MenuOrden";

const DEMORA_BUSQUEDA = 300;

const pedirEventos = paginaDe(buscarEventos, "eventos");

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

function Saludo() {
  const { usuario } = useAuth();
  const { colors } = useTheme();
  return (
    <View>
      <Text variant="headlineSmall">{`Hola, ${usuario?.nombre ?? ""}`}</Text>
      <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
        Encontrá tu próximo evento
      </Text>
    </View>
  );
}

const tituloDeLista = ({ hayFiltros, orden }) => {
  if (hayFiltros) return "Resultados";
  return orden === OPCIONES_ORDEN[0] ? "Próximos eventos" : "Todos los eventos";
};

function Filtros({ filtros }) {
  return (
    <View style={estilos.filtros}>
      <Saludo />
      <Searchbar
        placeholder="Buscar eventos"
        value={filtros.texto}
        onChangeText={filtros.setTexto}
        returnKeyType="search"
        onSubmitEditing={Keyboard.dismiss}
        testID="buscador"
        accessibilityLabel="Buscar eventos"
      />
      <ChipsCategorias seleccionada={filtros.categoria} onElegir={filtros.setCategoria} />
      <View style={estilos.orden}>
        <MenuOrden seleccionada={filtros.orden} onElegir={filtros.setOrden} />
      </View>
      <Text variant="titleMedium" testID="titulo-lista">
        {tituloDeLista(filtros)}
      </Text>
    </View>
  );
}

function SinEventos({ filtros }) {
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

export default function Explorar() {
  const filtros = useFiltros();
  const lista = useListaPaginada(pedirEventos, filtros.criterio);
  return (
    <Pantalla>
      <ListaPaginada
        testID="lista-eventos"
        lista={lista}
        renderItem={(evento) => (
          <TarjetaEvento evento={evento} onPress={() => router.push(`/eventos/${evento.id}`)} />
        )}
        encabezado={<Filtros filtros={filtros} />}
        vacio={<SinEventos filtros={filtros} />}
      />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  filtros: { gap: espaciado.md },
  orden: { alignItems: "flex-start" },
});
