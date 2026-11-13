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

function useConversacion(compraId) {
  const cargar = useCallback(() => listarMensajes(compraId), [compraId]);
  const carga = useCargar(cargar);
  const [historial, setHistorial] = useState(null);
  if (carga.datos && carga.datos !== historial) setHistorial(carga.datos);
  const [recibidos, setRecibidos] = useState([]);
  const agregar = useCallback((nuevo) => setRecibidos((actuales) => [...actuales, nuevo]), []);
  const mensajes = useMemo(() => unirMensajes(historial ?? [], recibidos), [historial, recibidos]);
  const { conectado } = useSalaDeCompra(
    compraId,
    { "mensaje:nuevo": agregar },
    { alReconectar: carga.recargar },
  );
  return { carga, cargado: historial !== null, mensajes, agregar, conectado };
}

export function useChatCompra(compraId) {
  const { carga, cargado, mensajes, agregar, conectado } = useConversacion(compraId);
  const [texto, setTexto] = useState("");
  const { enCurso, error, enviar } = useEnvio();
  const enviando = enCurso !== null;

  return {
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
