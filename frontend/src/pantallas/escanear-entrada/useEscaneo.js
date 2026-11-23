import { useRef, useState } from "react";
import { mensajeDeError } from "../../api/cliente";
import { obtenerCompra, validarEntrada } from "../../api/comprasApi";
import { useEnvio } from "../../hooks/useEnvio";
import { leerQrDeEntrada } from "../../utils/qrDeEntrada";

const ESCANEANDO = { fase: "escaneando" };
const conError = (error) => ({ fase: "error", error });

export const QR_AJENO = "Ese QR no es una entrada de AI Ticket It";
export const DE_OTRO_EVENTO = "Esa entrada es de otro evento";

export const ENTRADA_INEXISTENTE = "No existe la entrada";

async function buscarCompra(texto, eventoId) {
  const leido = leerQrDeEntrada(texto);
  if (leido === null) return conError(QR_AJENO);
  try {
    const compra = await obtenerCompra(leido.compraId);
    if (String(compra.evento.id) !== String(eventoId)) return conError(DE_OTRO_EVENTO);
    const existe = compra.entradas.some((entrada) => entrada.numero === leido.numero);
    if (!existe) return conError(ENTRADA_INEXISTENTE);
    return { fase: "compra", compra, numero: leido.numero };
  } catch (error) {
    return conError(mensajeDeError(error));
  }
}

export const entradaDe = ({ compra, numero }) =>
  compra.entradas.find((entrada) => entrada.numero === numero);

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
        () => validarEntrada(estado.compra.id, estado.numero),
        (compra) => setEstado({ fase: "validada", compra, numero: estado.numero }),
      ),
    escanearOtra: () => {
      leyendo.current = false;
      setEstado(ESCANEANDO);
    },
  };
}
