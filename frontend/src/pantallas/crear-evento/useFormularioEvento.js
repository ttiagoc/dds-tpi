import { useRef, useState } from "react";
import { router } from "expo-router";
import { crearEvento } from "../../api/eventosApi";
import { detallesDeError, mensajeDeError } from "../../api/cliente";
import { useEnvio } from "../../hooks/useEnvio";
import {
  MAXIMO_TIPOS,
  armarEvento,
  claveDeTipo,
  erroresDelBack,
  formularioVacio,
  tipoVacio,
  validarEvento,
} from "./armarEvento";
import { CAMPOS_DIRECCION } from "./direccionDelEvento";
import { conCambio, useUbicacionDelEvento } from "./useUbicacionDelEvento";

const sinClave = (errores, clave) => {
  if (!(clave in errores)) return errores;
  const { [clave]: _quitado, ...resto } = errores;
  return resto;
};

const sinErroresDeTipos = (errores) =>
  Object.fromEntries(
    Object.entries(errores).filter(([clave]) => !clave.startsWith("tiposEntrada.")),
  );

const CLAVES_QUE_LIMPIA = {
  dia: ["fecha"],
  hora: ["hora", "fecha"],
  ...Object.fromEntries(CAMPOS_DIRECCION.map((campo) => [campo, [campo, "ubicacion"]])),
};

export const resumenDeErrores = (cantidad) =>
  cantidad === 1 ? "Revisá el campo marcado" : `Revisá los ${cantidad} campos marcados`;

function useTipos(setValores, setErrores) {
  const proximaClave = useRef(1);
  const cambiarTipos = (cambio) =>
    setValores((actual) => ({ ...actual, tipos: cambio(actual.tipos) }));
  return {
    cambiarTipo: (indice, campo, valor) => {
      setErrores((errores) => sinClave(errores, claveDeTipo(indice, campo)));
      cambiarTipos((tipos) =>
        tipos.map((tipo, i) => (i === indice ? { ...tipo, [campo]: valor } : tipo)),
      );
    },
    agregarTipo: () => {
      const clave = proximaClave.current;
      proximaClave.current += 1;
      cambiarTipos((tipos) => (tipos.length < MAXIMO_TIPOS ? [...tipos, tipoVacio(clave)] : tipos));
    },
    quitarTipo: (indice) => {
      setErrores(sinErroresDeTipos);
      cambiarTipos((tipos) => (tipos.length > 1 ? tipos.filter((_, i) => i !== indice) : tipos));
    },
  };
}

function useErrores(alMarcarErrores) {
  const [errores, setErrores] = useState({});
  const [resumen, setResumen] = useState(null);
  const [aviso, setAviso] = useState(null);

  const marcar = (nuevos, texto) => {
    setErrores(nuevos);
    setResumen(texto);
    const claves = Object.keys(nuevos);
    if (claves.length > 0) alMarcarErrores(claves);
  };

  const alFallar = (error) => {
    const mensaje = mensajeDeError(error);
    setAviso(mensaje);
    marcar(erroresDelBack(detallesDeError(error)), mensaje);
  };

  const limpiar = (campo) =>
    setErrores((actuales) => (CLAVES_QUE_LIMPIA[campo] ?? [campo]).reduce(sinClave, actuales));

  return {
    errores,
    setErrores,
    resumen,
    aviso,
    cerrarAviso: () => setAviso(null),
    marcar,
    alFallar,
    limpiar,
  };
}

export function useFormularioEvento({ alMarcarErrores = () => {}, ahora = () => new Date() } = {}) {
  const [valores, setValores] = useState(formularioVacio);
  const { setErrores, marcar, alFallar, limpiar, ...errores } = useErrores(alMarcarErrores);
  const { enCurso, enviar } = useEnvio();
  const enviando = enCurso !== null;

  const publicar = () => {
    const locales = validarEvento(valores, ahora());
    const cantidad = Object.keys(locales).length;
    if (cantidad > 0) return marcar(locales, resumenDeErrores(cantidad));
    marcar({}, null);
    return enviar(
      "publicar",
      () => crearEvento(armarEvento(valores)),
      () => router.dismissTo({ pathname: "/mis-eventos", params: { aviso: "evento-creado" } }),
      alFallar,
    );
  };

  return {
    valores,
    ...errores,
    cambiar: (campo, valor) => {
      limpiar(campo);
      setValores((actual) => conCambio(actual, campo, valor, CAMPOS_DIRECCION.includes(campo)));
    },
    ...useUbicacionDelEvento(valores, { setValores, setErrores }),
    ...useTipos(setValores, setErrores),
    puedeAgregarTipo: valores.tipos.length < MAXIMO_TIPOS && !enviando,
    enviando,
    publicar,
  };
}
