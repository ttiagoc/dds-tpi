import { StyleSheet } from "react-native";
import { router } from "expo-router";
import { FAB, Snackbar } from "react-native-paper";
import { listarMisEventos } from "../../api/organizadoresApi";
import { EstadoVacio } from "../../components/EstadoVacio";
import { ListaPaginada } from "../../components/ListaPaginada";
import { Pantalla } from "../../components/Pantalla";
import { useAvisoDeRuta } from "../../hooks/useAvisoDeRuta";
import { paginaDe, useListaPaginada } from "../../hooks/useListaPaginada";
import { useRecargarAlVolver } from "../../hooks/useRecargarAlVolver";
import { ESPACIO_FAB, espaciado } from "../../tema/espaciado";
import { TarjetaEventoPropio } from "./TarjetaEventoPropio";

const pedirEventos = paginaDe(listarMisEventos, "eventos");
const SIN_CRITERIO = {};
const AVISOS = { "evento-creado": "Evento publicado" };

export default function MisEventos() {
  const lista = useListaPaginada(pedirEventos, SIN_CRITERIO);
  const aviso = useAvisoDeRuta(AVISOS);
  useRecargarAlVolver(lista.recargar);
  return (
    <Pantalla>
      <ListaPaginada
        testID="lista-mis-eventos"
        lista={lista}
        espacioInferior={ESPACIO_FAB}
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
      <FAB
        icon="plus"
        label="Nuevo evento"
        style={estilos.fab}
        onPress={() => router.push("/eventos/nuevo")}
        testID="fab-nuevo-evento"
      />
      <Snackbar visible={!!aviso.texto} onDismiss={aviso.cerrar} testID="mis-eventos-aviso">
        {aviso.texto ?? ""}
      </Snackbar>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  fab: { position: "absolute", right: espaciado.lg, bottom: espaciado.lg },
});
