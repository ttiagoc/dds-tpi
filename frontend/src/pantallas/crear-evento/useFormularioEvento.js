import { useRef, useState } from "react";
import { router } from "expo-router";
import { crearEvento } from "../../api/eventosApi";
import { useEnvio } from "../../hooks/useEnvio";
import { MAXIMO_TIPOS, armarEvento, estaCompleto, formularioVacio, tipoVacio } from "./armarEvento";

function useTipos(setValores) {
  const proximaClave = useRef(1);
  const cambiarTipos = (cambio) =>
    setValores((actual) => ({ ...actual, tipos: cambio(actual.tipos) }));
  return {
    cambiarTipo: (indice, campo, valor) =>
      cambiarTipos((tipos) =>
        tipos.map((tipo, i) => (i === indice ? { ...tipo, [campo]: valor } : tipo)),
      ),
    agregarTipo: () => {
      const clave = proximaClave.current;
      proximaClave.current += 1;
      cambiarTipos((tipos) => (tipos.length < MAXIMO_TIPOS ? [...tipos, tipoVacio(clave)] : tipos));
    },
    quitarTipo: (indice) =>
      cambiarTipos((tipos) => (tipos.length > 1 ? tipos.filter((_, i) => i !== indice) : tipos)),
  };
}

export function useFormularioEvento() {
  const [valores, setValores] = useState(formularioVacio);
  const { enCurso, error, enviar } = useEnvio();
  const enviando = enCurso !== null;

  const publicar = () =>
    enviar(
      "publicar",
      () => crearEvento(armarEvento(valores)),
      () => router.dismissTo({ pathname: "/mis-eventos", params: { aviso: "evento-creado" } }),
    );

  return {
    valores,
    cambiar: (campo, valor) => setValores((actual) => ({ ...actual, [campo]: valor })),
    ...useTipos(setValores),
    puedeAgregarTipo: valores.tipos.length < MAXIMO_TIPOS && !enviando,
    puedePublicar: estaCompleto(valores) && !enviando,
    enviando,
    error,
    publicar,
  };
}
