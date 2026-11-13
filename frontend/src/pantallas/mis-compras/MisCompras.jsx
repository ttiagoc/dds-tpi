import { router } from "expo-router";
import { listarMisCompras } from "../../api/comprasApi";
import { EstadoVacio } from "../../components/EstadoVacio";
import { ListaDeCompras } from "../../components/ListaDeCompras";
import { Pantalla } from "../../components/Pantalla";
import { paginaDe } from "../../hooks/useListaPaginada";

const pedirCompras = paginaDe(listarMisCompras, "compras");
const SIN_CRITERIO = {};

const VACIO = {
  testID: "sin-compras",
  textoFiltrada: (etiqueta) => `No tenés compras en estado ${etiqueta}`,
  sinFiltro: (
    <EstadoVacio
      icono="ticket-outline"
      texto="Todavía no compraste entradas"
      accion={{
        etiqueta: "Explorar eventos",
        onPress: () => router.navigate("/explorar"),
        testID: "ir-a-explorar",
      }}
      testID="sin-compras"
    />
  ),
};

export default function MisCompras() {
  return (
    <Pantalla>
      <ListaDeCompras
        testID="lista-compras"
        pedir={pedirCompras}
        criterio={SIN_CRITERIO}
        vacio={VACIO}
      />
    </Pantalla>
  );
}
