import { createContext, useContext, useEffect, useState } from "react";
import { guardarPreferencia, leerPreferencia, PREFERENCIA_POR_DEFECTO } from "./preferenciaTema";

const Contexto = createContext({ preferencia: PREFERENCIA_POR_DEFECTO, elegir: () => {} });

export function PreferenciaTemaProvider({ children }) {
  const [preferencia, setPreferencia] = useState(PREFERENCIA_POR_DEFECTO);
  useEffect(() => {
    let vigente = true;
    leerPreferencia().then((guardada) => {
      if (vigente) setPreferencia(guardada);
    });
    return () => {
      vigente = false;
    };
  }, []);
  const elegir = (nueva) => {
    setPreferencia(nueva);
    guardarPreferencia(nueva).catch(() => {});
  };
  return <Contexto.Provider value={{ preferencia, elegir }}>{children}</Contexto.Provider>;
}

export const usePreferenciaTema = () => useContext(Contexto);
