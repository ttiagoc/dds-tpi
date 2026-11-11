import { useTheme } from "react-native-paper";
import { ChipsFiltro } from "./ChipsFiltro";
import { ESTADOS_COMPRA } from "../tema/tema";

export function FiltroEstadoCompra({ estado, onElegir }) {
  const { estados } = useTheme();
  const opciones = ESTADOS_COMPRA.map((valor) => ({ valor, etiqueta: estados[valor].etiqueta }));
  return (
    <ChipsFiltro
      opciones={opciones}
      seleccionada={estado}
      onElegir={onElegir}
      prefijoTestID="filtro-estado"
    />
  );
}
