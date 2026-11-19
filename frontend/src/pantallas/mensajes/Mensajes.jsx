import { useEffect, useRef } from "react";
import { router } from "expo-router";
import { listarConversaciones } from "../../api/conversacionesApi";
import { useAuth } from "../../auth/AuthContext";
import { EncabezadoPestania } from "../../components/EncabezadoPestania";
import { EstadoVacio } from "../../components/EstadoVacio";
import { ListaPaginada } from "../../components/ListaPaginada";
import { Pantalla } from "../../components/Pantalla";
import { paginaDe, useListaPaginada } from "../../hooks/useListaPaginada";
import { useRecargarAlVolver } from "../../hooks/useRecargarAlVolver";
import { useNoLeidos } from "../../mensajes/NoLeidosContext";
import { FilaConversacion } from "./FilaConversacion";

const paginaDeConversaciones = paginaDe(listarConversaciones, "conversaciones");
const pedirConversaciones = (criterio, pagina) =>
  paginaDeConversaciones(criterio, pagina).then((resultado) => ({
    ...resultado,
    items: resultado.items.map((conversacion) => ({ ...conversacion, id: conversacion.compraId })),
  }));
const SIN_CRITERIO = {};

function useRecargarConNovedades(recargar) {
  const { version } = useNoLeidos();
  const vista = useRef(version);
  useEffect(() => {
    if (vista.current === version) return;
    vista.current = version;
    recargar();
  }, [version, recargar]);
}

export default function Mensajes() {
  const { usuario } = useAuth();
  const lista = useListaPaginada(pedirConversaciones, SIN_CRITERIO);
  useRecargarAlVolver(lista.recargar);
  useRecargarConNovedades(lista.recargar);
  return (
    <Pantalla bordes={["top"]}>
      <ListaPaginada
        testID="lista-conversaciones"
        lista={lista}
        encabezado={<EncabezadoPestania titulo="Mensajes" />}
        renderItem={(conversacion) => (
          <FilaConversacion
            conversacion={conversacion}
            usuarioId={usuario?.id}
            onPress={() => router.push(`/compras/${conversacion.compraId}/chat`)}
          />
        )}
        vacio={
          <EstadoVacio
            icono="chat-outline"
            texto="Todavía no tenés mensajes"
            testID="sin-conversaciones"
          />
        }
      />
    </Pantalla>
  );
}
