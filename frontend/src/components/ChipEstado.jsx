import { Chip, useTheme } from "react-native-paper";

export function ChipEstado({ estado }) {
  const { estados, colors } = useTheme();
  const { etiqueta, icono, fondo, texto } = estados[estado] ?? {
    etiqueta: estado,
    icono: "help-circle-outline",
    fondo: colors.surfaceVariant,
    texto: colors.onSurfaceVariant,
  };
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
