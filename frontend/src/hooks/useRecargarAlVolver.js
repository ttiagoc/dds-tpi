import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";

export function useRecargarAlVolver(recargar) {
  const primeraVez = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeraVez.current) {
        primeraVez.current = false;
        return;
      }
      recargar();
    }, [recargar]),
  );
}
