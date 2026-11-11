import { useState } from "react";
import { router } from "expo-router";
import { reseniarCompra } from "../../api/comprasApi";
import { useEnvio } from "../../hooks/useEnvio";

export const MAXIMO_DETALLE = 500;

export function useResenia(compraId) {
  const [puntuacion, setPuntuacion] = useState(null);
  const [detalle, setDetalle] = useState("");
  const { enCurso, error, enviar } = useEnvio();
  const completa = puntuacion !== null && detalle.trim().length > 0;

  const confirmar = () =>
    enviar(
      "reseniar",
      () => reseniarCompra(compraId, { puntuacion, detalle: detalle.trim() }),
      () =>
        router.dismissTo({
          pathname: "/compras/[id]",
          params: { id: String(compraId), aviso: "resenia" },
        }),
    );

  return {
    puntuacion,
    detalle,
    elegirPuntuacion: setPuntuacion,
    escribir: setDetalle,
    enviando: enCurso !== null,
    error,
    puedeEnviar: completa && enCurso === null,
    confirmar,
  };
}
