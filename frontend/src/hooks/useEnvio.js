import { useRef, useState } from "react";
import { codigoDeError, mensajeDeError } from "../api/cliente";

export function useEnvio({ recargar } = {}) {
  const [enCurso, setEnCurso] = useState(null);
  const [error, setError] = useState(null);
  const ocupado = useRef(false);

  const enviar = async (nombre, pedir, alResolver) => {
    if (ocupado.current) return;
    ocupado.current = true;
    setEnCurso(nombre);
    setError(null);
    try {
      alResolver(await pedir());
    } catch (e) {
      setError(mensajeDeError(e));
      if (codigoDeError(e) === 422) recargar?.();
    } finally {
      ocupado.current = false;
      setEnCurso(null);
    }
  };

  return { enCurso, error, enviar };
}
