import { router } from "expo-router";
import { listarMisEventos } from "../../api/organizadoresApi";
import { EstadoVacio } from "../../components/EstadoVacio";
import { ListaPaginada } from "../../components/ListaPaginada";
import { Pantalla } from "../../components/Pantalla";
import { paginaDe, useListaPaginada } from "../../hooks/useListaPaginada";
import { useRecargarAlVolver } from "../../hooks/useRecargarAlVolver";
import { TarjetaEventoPropio } from "./TarjetaEventoPropio";

const pedirEventos = paginaDe(listarMisEventos, "eventos");
const SIN_CRITERIO = {};

export default function MisEventos() {
  const lista = useListaPaginada(pedirEventos, SIN_CRITERIO);
  useRecargarAlVolver(lista.recargar);
  return (
    <Pantalla>
      <ListaPaginada
        testID="lista-mis-eventos"
        lista={lista}
        renderItem={(evento) => (
          <TarjetaEventoPropio
            evento={evento}
            onPress={() => router.push(`/eventos/${evento.id}/compras`)}
          />
        )}
        vacio={
          <EstadoVacio
            icono="calendar-blank-outline"
            texto="Todavía no publicaste eventos"
            testID="sin-eventos-propios"
          />
        }
      />
    </Pantalla>
  );
}
