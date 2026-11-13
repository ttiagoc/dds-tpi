import { Chip } from "react-native-paper";
import { useEstadoCompra } from "../tema/useEstadoCompra";

export function ChipEstado({ estado }) {
  const { etiqueta, icono, fondo, texto } = useEstadoCompra(estado);
  return (
    <Chip
      icon={icono}
      compact
      style={{ backgroundColor: fondo, alignSelf: "flex-start" }}
      textStyle={{ color: texto }}
      selectedColor={texto}
      accessibilityLabel={`Estado: ${etiqueta}`}
      testID={`chip-estado-${estado}`}
    >
      {etiqueta}
    </Chip>
  );
}
