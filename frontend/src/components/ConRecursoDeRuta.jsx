import { useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import { useCargar } from "../hooks/useCargar";
import { ConCarga } from "./ConCarga";

export function ConRecursoDeRuta({ obtener, iconoInexistente, testIDInexistente, children }) {
  const { id } = useLocalSearchParams();
  const cargar = useCallback(() => obtener(id), [obtener, id]);
  const carga = useCargar(cargar);
  return (
    <ConCarga
      carga={carga}
      iconoInexistente={iconoInexistente}
      testIDInexistente={testIDInexistente}
    >
      {(datos) => children(datos, carga)}
    </ConCarga>
  );
}
