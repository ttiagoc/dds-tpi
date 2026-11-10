import { useCallback, useEffect, useState } from "react";
import { buscarEventos } from "../../api/eventosApi";
import { mensajeDeError } from "../../api/cliente";

export const POR_PAGINA = 10;
const SIN_RESULTADO = { clave: null, eventos: [], page: 0, totalPages: 0, error: null };

const pedirPagina = (claveCriterio, page) =>
  buscarEventos({ ...JSON.parse(claveCriterio), page, limit: POR_PAGINA });

function usePrimeraPagina(claveCriterio, version) {
  const [resultado, setResultado] = useState(SIN_RESULTADO);
  useEffect(() => {
    let vigente = true;
    const clave = `${claveCriterio}#${version}`;
    const terminar = (cambios) => {
      if (vigente) setResultado({ ...SIN_RESULTADO, clave, ...cambios });
    };
    pedirPagina(claveCriterio, 1).then(
      ({ eventos, page, totalPages }) => terminar({ eventos, page, totalPages }),
      (error) => terminar({ error: mensajeDeError(error) }),
    );
    return () => {
      vigente = false;
    };
  }, [claveCriterio, version]);
  return [resultado, setResultado];
}

function useCargarMas(claveCriterio, resultado, setResultado) {
  const { clave, page, cargandoMas } = resultado;
  return useCallback(() => {
    if (cargandoMas) return;
    const siSigueVigente = (cambios) =>
      setResultado((previo) =>
        previo.clave === clave ? { ...previo, ...cambios(previo) } : previo,
      );
    siSigueVigente(() => ({ cargandoMas: true, errorMas: null }));
    pedirPagina(claveCriterio, page + 1).then(
      (siguiente) =>
        siSigueVigente((previo) => ({
          cargandoMas: false,
          eventos: [...previo.eventos, ...siguiente.eventos],
          page: siguiente.page,
          totalPages: siguiente.totalPages,
        })),
      (error) => siSigueVigente(() => ({ cargandoMas: false, errorMas: mensajeDeError(error) })),
    );
  }, [claveCriterio, clave, page, cargandoMas, setResultado]);
}

export function useEventosPaginados(criterio) {
  const claveCriterio = JSON.stringify(criterio);
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = usePrimeraPagina(claveCriterio, version);
  const cargarMas = useCargarMas(claveCriterio, resultado, setResultado);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  const cargando = resultado.clave !== `${claveCriterio}#${version}`;
  return {
    eventos: resultado.eventos,
    cargando,
    error: cargando ? null : resultado.error,
    hayMas: !cargando && resultado.page < resultado.totalPages,
    cargandoMas: !!resultado.cargandoMas,
    errorMas: resultado.errorMas ?? null,
    cargarMas,
    recargar,
  };
}
