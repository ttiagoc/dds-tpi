import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { leerSesion, guardarSesion, borrarSesion } from "./sesion";
import { login, obtenerYo } from "../api/authApi";
import { establecerToken, alExpirarSesion } from "../api/cliente";

const AuthContext = createContext(null);

async function restaurar(guardada) {
  try {
    const usuario = await obtenerYo();
    const sesion = { token: guardada.token, usuario };
    await guardarSesion(sesion);
    return sesion;
  } catch (error) {
    if (error.response?.status !== 401) return guardada;
    await borrarSesion();
    return null;
  }
}

function useSesion(sesionInicial) {
  const [sesion, setSesionInterna] = useState(sesionInicial ?? null);
  const [cargando, setCargando] = useState(!sesionInicial);

  const setSesion = useCallback((nueva) => {
    establecerToken(nueva?.token ?? null);
    setSesionInterna(nueva);
  }, []);

  useEffect(() => {
    if (sesionInicial) {
      establecerToken(sesionInicial.token);
      return;
    }
    (async () => {
      const guardada = await leerSesion();
      if (guardada) establecerToken(guardada.token);
      setSesion(guardada ? await restaurar(guardada) : null);
      setCargando(false);
    })();
  }, [sesionInicial, setSesion]);

  return { sesion, setSesion, cargando };
}

export function AuthProvider({ children, sesionInicial = null }) {
  const { sesion, setSesion, cargando } = useSesion(sesionInicial);

  const cerrarSesion = useCallback(async () => {
    setSesion(null);
    await borrarSesion();
  }, [setSesion]);

  const iniciarSesion = useCallback(
    async (credenciales) => {
      const nueva = await login(credenciales);
      await guardarSesion(nueva);
      setSesion(nueva);
    },
    [setSesion],
  );

  useEffect(() => {
    alExpirarSesion(cerrarSesion);
  }, [cerrarSesion]);

  const valor = useMemo(
    () => ({ usuario: sesion?.usuario ?? null, cargando, iniciarSesion, cerrarSesion }),
    [sesion, cargando, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth tiene que usarse dentro de AuthProvider");
  return contexto;
}
