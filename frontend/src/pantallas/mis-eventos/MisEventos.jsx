import { StyleSheet } from "react-native";
import { router } from "expo-router";
import { FAB, Snackbar, useTheme } from "react-native-paper";
import { listarMisEventos } from "../../api/organizadoresApi";
import { useAuth } from "../../auth/AuthContext";
import { EncabezadoPestania } from "../../components/EncabezadoPestania";
import { EstadoVacio } from "../../components/EstadoVacio";
import { ListaPaginada } from "../../components/ListaPaginada";
import { Pantalla } from "../../components/Pantalla";
import { useAvisoDeRuta } from "../../hooks/useAvisoDeRuta";
import { useListaPaginada } from "../../hooks/useListaPaginada";
import { useRecargarAlVolver } from "../../hooks/useRecargarAlVolver";
import { ESPACIO_FAB, espaciado, radios } from "../../tema/espaciado";
import { ResumenVentas } from "./ResumenVentas";
import { TarjetaEventoPropio } from "./TarjetaEventoPropio";

const pedirEventos = (criterio, pagina) =>
  listarMisEventos({ ...criterio, ...pagina }).then((respuesta) => ({
    items: respuesta.eventos,
    page: respuesta.page,
    totalPages: respuesta.totalPages,
    extra: respuesta.resumen,
  }));
const SIN_CRITERIO = {};
const AVISOS = { "evento-creado": "Evento publicado" };

function Encabezado({ resumen }) {
  const { usuario } = useAuth();
  return (
    <>
      <EncabezadoPestania conLogo saludo={`Hola, ${usuario?.nombre ?? ""}`} titulo="Mis eventos" />
      <ResumenVentas resumen={resumen} />
    </>
  );
}

export default function MisEventos() {
  const { colors } = useTheme();
  const lista = useListaPaginada(pedirEventos, SIN_CRITERIO);
  const aviso = useAvisoDeRuta(AVISOS);
  useRecargarAlVolver(lista.recargar);
  return (
    <Pantalla bordes={["top"]}>
      <ListaPaginada
        testID="lista-mis-eventos"
        lista={lista}
        encabezado={<Encabezado resumen={lista.extra} />}
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
        style={[estilos.fab, { backgroundColor: colors.primary }]}
        color={colors.onPrimary}
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
  fab: {
    position: "absolute",
    right: espaciado.lg,
    bottom: espaciado.lg,
    borderRadius: radios.pill,
  },
});
