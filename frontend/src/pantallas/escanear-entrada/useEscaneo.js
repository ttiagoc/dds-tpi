import { useRef, useState } from "react";
import { mensajeDeError } from "../../api/cliente";
import { marcarUtilizada, obtenerCompra } from "../../api/comprasApi";
import { useEnvio } from "../../hooks/useEnvio";
import { leerQrDeEntrada } from "../../utils/qrDeEntrada";

const ESCANEANDO = { fase: "escaneando" };
const conError = (error) => ({ fase: "error", error });

export const QR_AJENO = "Ese QR no es una entrada de AI Ticket It";
export const DE_OTRO_EVENTO = "Esa entrada es de otro evento";

async function buscarCompra(texto, eventoId) {
  const id = leerQrDeEntrada(texto);
  if (id === null) return conError(QR_AJENO);
  try {
    const compra = await obtenerCompra(id);
    if (String(compra.evento.id) !== String(eventoId)) return conError(DE_OTRO_EVENTO);
    return { fase: "compra", compra };
  } catch (error) {
    return conError(mensajeDeError(error));
  }
}

export function useEscaneo(eventoId) {
  const [estado, setEstado] = useState(ESCANEANDO);
  const leyendo = useRef(false);
  const envio = useEnvio();

  const leer = async ({ data }) => {
    if (leyendo.current) return;
    leyendo.current = true;
    setEstado({ fase: "buscando" });
    setEstado(await buscarCompra(data, eventoId));
  };

  return {
    ...estado,
    escaneando: estado.fase === "escaneando",
    validando: envio.enCurso !== null,
    errorAlValidar: envio.error,
    leer,
    validar: () =>
      envio.enviar(
        "validar",
        () => marcarUtilizada(estado.compra.id),
        (compra) => setEstado({ fase: "validada", compra }),
      ),
    escanearOtra: () => {
      leyendo.current = false;
      setEstado(ESCANEANDO);
    },
  };
}
