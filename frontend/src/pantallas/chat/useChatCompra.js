import { useCallback, useMemo, useState } from "react";
import { enviarMensaje, listarMensajes } from "../../api/comprasApi";
import { useCargar } from "../../hooks/useCargar";
import { useEnvio } from "../../hooks/useEnvio";
import { useSalaDeCompra } from "../../hooks/useSalaDeCompra";

const cronologico = (a, b) => new Date(a.enviado) - new Date(b.enviado) || a.id - b.id;

export function unirMensajes(...listas) {
  const porId = new Map(listas.flat().map((m) => [m.id, m]));
  return [...porId.values()].sort(cronologico);
}

const SIN_HISTORIAL = {
  pagina: null,
  cargados: [],
  hayAnteriores: false,
  anterioresPedidos: false,
};

const conPagina = (pagina) => (previo) => ({
  ...previo,
  pagina,
  cargados: unirMensajes(previo.cargados, pagina.mensajes),
  hayAnteriores: previo.anterioresPedidos ? previo.hayAnteriores : pagina.hayMas,
});

const conAnteriores = (anteriores) => (previo) => ({
  ...previo,
  cargados: unirMensajes(anteriores.mensajes, previo.cargados),
  hayAnteriores: anteriores.hayMas,
  anterioresPedidos: true,
});

function useAnteriores(compraId, historial, setHistorial) {
  const { enCurso, error, enviar } = useEnvio();
  const masViejo = Math.min(...historial.cargados.map((m) => m.id));
  return {
    hayAnteriores: historial.hayAnteriores,
    cargandoAnteriores: enCurso !== null,
    errorAnteriores: error,
    cargarAnteriores: () =>
      enviar(
        "anteriores",
        () => listarMensajes(compraId, { antesDe: masViejo }),
        (anteriores) => setHistorial(conAnteriores(anteriores)),
      ),
  };
}

function useConversacion(compraId) {
  const cargar = useCallback(() => listarMensajes(compraId), [compraId]);
  const carga = useCargar(cargar);
  const [historial, setHistorial] = useState(SIN_HISTORIAL);
  if (carga.datos && carga.datos !== historial.pagina) setHistorial(conPagina(carga.datos));
  const [recibidos, setRecibidos] = useState([]);
  const agregar = useCallback((nuevo) => setRecibidos((actuales) => [...actuales, nuevo]), []);
  const mensajes = useMemo(
    () => unirMensajes(historial.cargados, recibidos),
    [historial.cargados, recibidos],
  );
  const { conectado } = useSalaDeCompra(
    compraId,
    { "mensaje:nuevo": agregar },
    { alReconectar: carga.recargar },
  );
  const anteriores = useAnteriores(compraId, historial, setHistorial);
  return { carga, cargado: historial.pagina !== null, mensajes, agregar, conectado, anteriores };
}

export function useChatCompra(compraId) {
  const { carga, cargado, mensajes, agregar, conectado, anteriores } = useConversacion(compraId);
  const [texto, setTexto] = useState("");
  const { enCurso, error, enviar } = useEnvio();
  const enviando = enCurso !== null;

  return {
    ...anteriores,
    mensajes,
    cargado,
    error: carga.error,
    recargar: carga.recargar,
    conectado,
    texto,
    escribir: setTexto,
    puedeEnviar: !enviando && texto.trim() !== "",
    enviando,
    errorEnvio: error,
    enviar: () =>
      enviar(
        "mensaje",
        () => enviarMensaje(compraId, texto.trim()),
        (enviado) => {
          agregar(enviado);
          setTexto("");
        },
      ),
  };
}
