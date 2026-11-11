import { useState } from "react";
import { router } from "expo-router";
import { useTheme } from "react-native-paper";
import { listarMisCompras } from "../../api/comprasApi";
import { EstadoVacio } from "../../components/EstadoVacio";
import { FiltroEstadoCompra } from "../../components/FiltroEstadoCompra";
import { ListaPaginada } from "../../components/ListaPaginada";
import { Pantalla } from "../../components/Pantalla";
import { TarjetaCompra } from "../../components/TarjetaCompra";
import { paginaDe, useListaPaginada } from "../../hooks/useListaPaginada";
import { useRecargarAlVolver } from "../../hooks/useRecargarAlVolver";

const pedirCompras = paginaDe(listarMisCompras, "compras");

function SinCompras({ estado, onVerTodas }) {
  const { estados } = useTheme();
  if (estado) {
    return (
      <EstadoVacio
        icono="filter-remove-outline"
        texto={`No tenés compras en estado ${estados[estado].etiqueta}`}
        accion={{ etiqueta: "Ver todas", onPress: onVerTodas, testID: "ver-todas" }}
        testID="sin-compras"
      />
    );
  }
  return (
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
  );
}

export default function MisCompras() {
  const [estado, setEstado] = useState(null);
  const lista = useListaPaginada(pedirCompras, { estado: estado ?? undefined });
  useRecargarAlVolver(lista.recargar);
  return (
    <Pantalla>
      <ListaPaginada
        testID="lista-compras"
        lista={lista}
        renderItem={(compra) => (
          <TarjetaCompra compra={compra} onPress={() => router.push(`/compras/${compra.id}`)} />
        )}
        encabezado={<FiltroEstadoCompra estado={estado} onElegir={setEstado} />}
        vacio={<SinCompras estado={estado} onVerTodas={() => setEstado(null)} />}
      />
    </Pantalla>
  );
}
