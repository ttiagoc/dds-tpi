import { useEffect, useState } from "react";

export function useDebounce(valor, ms) {
  const [demorado, setDemorado] = useState(valor);
  useEffect(() => {
    const temporizador = setTimeout(() => setDemorado(valor), ms);
    return () => clearTimeout(temporizador);
  }, [valor, ms]);
  return demorado;
}
