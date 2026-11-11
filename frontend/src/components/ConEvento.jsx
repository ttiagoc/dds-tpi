import { useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import { obtenerEvento } from "../api/eventosApi";
import { useCargar } from "../hooks/useCargar";
import { ConCarga } from "./ConCarga";

export function ConEvento({ children }) {
  const { id } = useLocalSearchParams();
  const cargar = useCallback(() => obtenerEvento(id), [id]);
  const carga = useCargar(cargar);
  return (
    <ConCarga
      carga={carga}
      iconoInexistente="calendar-remove"
      testIDInexistente="evento-inexistente"
    >
      {(evento) => children(evento, carga)}
    </ConCarga>
  );
}
