import { useCallback } from "react";
import { listarCategorias } from "../../api/categoriasApi";
import { ChipsFiltro } from "../../components/ChipsFiltro";
import { useCargar } from "../../hooks/useCargar";

export function ChipsCategorias({ seleccionada, onElegir }) {
  const cargar = useCallback(() => listarCategorias(), []);
  const { datos: categorias } = useCargar(cargar);
  if (!categorias?.length) return null;
  return (
    <ChipsFiltro
      opciones={categorias.map(({ id, nombre }) => ({ valor: id, etiqueta: nombre }))}
      seleccionada={seleccionada}
      onElegir={onElegir}
      prefijoTestID="chip-categoria"
    />
  );
}
