import { useCallback, useEffect, useState } from "react";
import { mensajeDeError } from "../api/cliente";

export function useCargar(cargar) {
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState({ cargar: null, version: -1, datos: null });

  useEffect(() => {
    let vigente = true;
    const terminar = (cambios) => {
      if (vigente) setResultado({ cargar, version, datos: null, error: null, ...cambios });
    };
    cargar().then(
      (datos) => terminar({ datos }),
      (error) =>
        terminar({
          error: mensajeDeError(error),
          codigoError: error?.response?.status ?? null,
        }),
    );
    return () => {
      vigente = false;
    };
  }, [cargar, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  const cargando = resultado.cargar !== cargar || resultado.version !== version;
  return {
    datos: resultado.datos,
    cargando,
    error: cargando ? null : resultado.error,
    codigoError: cargando ? null : (resultado.codigoError ?? null),
    recargar,
  };
}
