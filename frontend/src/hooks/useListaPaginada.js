import { useCallback, useEffect, useRef, useState } from "react";
import { mensajeDeError } from "../api/cliente";

export const POR_PAGINA = 10;
const SIN_RESULTADO = {
  clave: null,
  criterio: null,
  items: [],
  extra: null,
  page: 0,
  totalPages: 0,
  error: null,
};

export const paginaDe = (listar, campo) => (criterio, pagina) =>
  listar({ ...criterio, ...pagina }).then((respuesta) => ({
    items: respuesta[campo],
    page: respuesta.page,
    totalPages: respuesta.totalPages,
  }));

const pedirPagina = (pedir, claveCriterio, page, limit) =>
  pedir(JSON.parse(claveCriterio), { page, limit });

function usePrimeraPagina(pedir, claveCriterio, version, porPagina) {
  const [resultado, setResultado] = useState(SIN_RESULTADO);
  useEffect(() => {
    let vigente = true;
    const clave = `${claveCriterio}#${version}`;
    const terminar = (cambios) => {
      if (vigente) setResultado((previo) => cambios(previo));
    };
    const nuevo = (cambios) => ({ ...SIN_RESULTADO, clave, criterio: claveCriterio, ...cambios });
    pedirPagina(pedir, claveCriterio, 1, porPagina).then(
      ({ items, page, totalPages, extra = null }) =>
        terminar(() => nuevo({ items, page, totalPages, extra })),
      (error) =>
        terminar((previo) =>
          previo.criterio === claveCriterio && previo.items.length > 0
            ? { ...previo, clave, errorRefresco: mensajeDeError(error) }
            : nuevo({ error: mensajeDeError(error), extra: previo.extra }),
        ),
    );
    return () => {
      vigente = false;
    };
  }, [pedir, claveCriterio, version, porPagina]);
  return [resultado, setResultado];
}

function useCargarMas(pedir, claveCriterio, porPagina, { resultado, setResultado }) {
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
    pedirPagina(pedir, claveCriterio, page + 1, porPagina)
      .then(
        (siguiente) =>
          siSigueVigente((previo) => ({
            cargandoMas: false,
            items: [...previo.items, ...siguiente.items],
            page: siguiente.page,
            totalPages: siguiente.totalPages,
          })),
        (error) => siSigueVigente(() => ({ cargandoMas: false, errorMas: mensajeDeError(error) })),
      )
      .finally(() => {
        enCurso.current = false;
      });
  }, [pedir, claveCriterio, porPagina, clave, page, setResultado]);
}

function estadoDeLista(resultado, { claveCriterio, cargando }) {
  return {
    items: resultado.criterio === claveCriterio ? resultado.items : [],
    extra: resultado.extra,
    cargando,
    error: cargando ? null : resultado.error,
    hayMas: !cargando && resultado.page < resultado.totalPages,
    cargandoMas: !!resultado.cargandoMas,
    errorMas: resultado.errorMas ?? null,
    errorRefresco: cargando ? null : (resultado.errorRefresco ?? null),
  };
}

export function useListaPaginada(pedir, criterio, { porPagina = POR_PAGINA } = {}) {
  const claveCriterio = JSON.stringify(criterio);
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = usePrimeraPagina(pedir, claveCriterio, version, porPagina);
  const cargarMas = useCargarMas(pedir, claveCriterio, porPagina, { resultado, setResultado });
  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  const cargando = resultado.clave !== `${claveCriterio}#${version}`;
  return { ...estadoDeLista(resultado, { claveCriterio, cargando }), cargarMas, recargar };
}

export function useRefresco(lista) {
  const [refrescando, setRefrescando] = useState(false);
  if (refrescando && !lista.cargando) setRefrescando(false);
  const refrescar = () => {
    setRefrescando(true);
    lista.recargar();
  };
  return { refrescando, refrescar };
}
