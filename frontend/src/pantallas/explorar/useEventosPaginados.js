import { useCallback, useEffect, useRef, useState } from "react";
import { buscarEventos } from "../../api/eventosApi";
import { mensajeDeError } from "../../api/cliente";

export const POR_PAGINA = 10;
const SIN_RESULTADO = {
  clave: null,
  criterio: null,
  eventos: [],
  page: 0,
  totalPages: 0,
  error: null,
};

const pedirPagina = (claveCriterio, page) =>
  buscarEventos({ ...JSON.parse(claveCriterio), page, limit: POR_PAGINA });

function usePrimeraPagina(claveCriterio, version) {
  const [resultado, setResultado] = useState(SIN_RESULTADO);
  useEffect(() => {
    let vigente = true;
    const clave = `${claveCriterio}#${version}`;
    const terminar = (cambios) => {
      if (vigente) setResultado((previo) => cambios(previo));
    };
    const nuevo = (cambios) => ({ ...SIN_RESULTADO, clave, criterio: claveCriterio, ...cambios });
    pedirPagina(claveCriterio, 1).then(
      ({ eventos, page, totalPages }) => terminar(() => nuevo({ eventos, page, totalPages })),
      (error) =>
        terminar((previo) =>
          previo.criterio === claveCriterio && previo.eventos.length > 0
            ? { ...previo, clave, errorRefresco: mensajeDeError(error) }
            : nuevo({ error: mensajeDeError(error) }),
        ),
    );
    return () => {
      vigente = false;
    };
  }, [claveCriterio, version]);
  return [resultado, setResultado];
}

function useCargarMas(claveCriterio, resultado, setResultado) {
  const { clave, page } = resultado;
  const enCurso = useRef(false);
  return useCallback(() => {
    if (enCurso.current) return;
    enCurso.current = true;
    const siSigueVigente = (cambios) =>
      setResultado((previo) =>
        previo.clave === clave ? { ...previo, ...cambios(previo) } : previo,
      );
    siSigueVigente(() => ({ cargandoMas: true, errorMas: null }));
    pedirPagina(claveCriterio, page + 1)
      .then(
        (siguiente) =>
          siSigueVigente((previo) => ({
            cargandoMas: false,
            eventos: [...previo.eventos, ...siguiente.eventos],
            page: siguiente.page,
            totalPages: siguiente.totalPages,
          })),
        (error) => siSigueVigente(() => ({ cargandoMas: false, errorMas: mensajeDeError(error) })),
      )
      .finally(() => {
        enCurso.current = false;
      });
  }, [claveCriterio, clave, page, setResultado]);
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
    errorRefresco: cargando ? null : (resultado.errorRefresco ?? null),
    cargarMas,
    recargar,
  };
}
