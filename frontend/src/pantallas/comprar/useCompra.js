import { useState } from "react";
import { router } from "expo-router";
import { crearCompra } from "../../api/comprasApi";
import { useEnvio } from "../../hooks/useEnvio";

export const MAXIMO_POR_COMPRA = 10;

const tope = (tipo) => (tipo ? Math.min(tipo.disponibles, MAXIMO_POR_COMPRA) : 0);

export function useSeleccion(tipos) {
  const [eleccion, setEleccion] = useState({ tipoId: null, cantidad: 1 });
  const disponibles = tipos.filter((tipo) => tipo.disponibles > 0);
  const tipo = disponibles.find((t) => t.id === eleccion.tipoId) ?? disponibles[0] ?? null;
  const maximo = tope(tipo);
  const cantidad = Math.min(eleccion.cantidad, maximo);
  const elegirTipo = (tipoId) => {
    const nuevo = tipos.find((t) => t.id === tipoId);
    setEleccion({ tipoId, cantidad: Math.min(cantidad, tope(nuevo)) });
  };
  const elegirCantidad = (nueva) => setEleccion({ tipoId: tipo.id, cantidad: nueva });
  return { tipo, cantidad, maximo, elegirTipo, elegirCantidad };
}

export function useConfirmar({ eventoId, tipo, cantidad, recargar }) {
  const { enCurso, error, enviar } = useEnvio({ recargar });
  const confirmar = () =>
    enviar(
      "comprar",
      () => crearCompra({ eventoId, tipoEntradaId: tipo.id, cantidad }),
      (compra) => router.replace(`/compras/${compra.id}`),
    );
  return { enviando: enCurso !== null, error, confirmar };
}
