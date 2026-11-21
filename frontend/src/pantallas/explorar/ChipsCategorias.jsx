import { listarCategorias } from "../../api/categoriasApi";
import { ChipsFiltro } from "../../components/ChipsFiltro";
import { paginaDe, useListaPaginada } from "../../hooks/useListaPaginada";

const pedirCategorias = paginaDe(listarCategorias, "categorias");
const SIN_CRITERIO = {};

export function ChipsCategorias({ seleccionada, onElegir }) {
  const lista = useListaPaginada(pedirCategorias, SIN_CRITERIO);
  if (lista.items.length === 0) return null;
  return (
    <ChipsFiltro
      opciones={lista.items.map(({ id, nombre }) => ({ valor: id, etiqueta: nombre }))}
      seleccionada={seleccionada}
      onElegir={onElegir}
      prefijoTestID="chip-categoria"
      alLlegarAlFinal={lista.hayMas ? lista.cargarMas : undefined}
    />
  );
}
