import { useCallback, useEffect, useState } from "react";
import { codigoDeError, mensajeDeError } from "../api/cliente";

const conCambios = (cargar, version, cambios) => (anterior) => ({
  cargar,
  version,
  datos: anterior.cargar === cargar ? anterior.datos : null,
  error: null,
  ...cambios,
});

export function useCargar(cargar) {
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState({ cargar: null, version: -1, datos: null });

  useEffect(() => {
    let vigente = true;
    const terminar = (cambios) => {
      if (vigente) setResultado(conCambios(cargar, version, cambios));
    };
    cargar().then(
      (datos) => terminar({ datos, codigoError: null }),
      (error) =>
        terminar({
          error: mensajeDeError(error),
          codigoError: codigoDeError(error),
        }),
    );
    return () => {
      vigente = false;
    };
  }, [cargar, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  const reemplazar = useCallback(
    (datos) => setResultado((actual) => ({ ...actual, datos, error: null, codigoError: null })),
    [],
  );
  const cargando = resultado.cargar !== cargar || resultado.version !== version;
  return {
    datos: resultado.datos,
    cargando,
    error: cargando ? null : resultado.error,
    codigoError: cargando ? null : (resultado.codigoError ?? null),
    recargar,
    reemplazar,
  };
}
