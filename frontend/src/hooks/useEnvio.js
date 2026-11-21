import { useRef, useState } from "react";
import { codigoDeError, mensajeDeError } from "../api/cliente";

export function useEnvio({ recargar } = {}) {
  const [enCurso, setEnCurso] = useState(null);
  const [error, setError] = useState(null);
  const ocupado = useRef(false);

  const enviar = async (nombre, pedir, alResolver, alFallar) => {
    if (ocupado.current) return;
    ocupado.current = true;
    setEnCurso(nombre);
    setError(null);
    let respuesta;
    try {
      respuesta = await pedir();
    } catch (e) {
      setError(mensajeDeError(e));
      if (codigoDeError(e) === 422) recargar?.();
      alFallar?.(e);
      return;
    } finally {
      ocupado.current = false;
      setEnCurso(null);
    }
    alResolver(respuesta);
  };

  return { enCurso, error, enviar };
}
