import { useState } from "react";
import { Button, Menu, useTheme } from "react-native-paper";

export const OPCIONES_ORDEN = [
  { ordenarPor: "fecha", orden: "asc", etiqueta: "Fecha: más próximos" },
  { ordenarPor: "fecha", orden: "desc", etiqueta: "Fecha: más lejanos" },
  { ordenarPor: "precio", orden: "asc", etiqueta: "Precio: menor a mayor" },
  { ordenarPor: "precio", orden: "desc", etiqueta: "Precio: mayor a menor" },
  { ordenarPor: "puntaje", orden: "desc", etiqueta: "Puntaje: mejor primero" },
  { ordenarPor: "puntaje", orden: "asc", etiqueta: "Puntaje: peor primero" },
];

export function MenuOrden({ seleccionada, onElegir }) {
  const { colors } = useTheme();
  const [abierto, setAbierto] = useState(false);
  const elegir = (opcion) => {
    setAbierto(false);
    onElegir(opcion);
  };
  return (
    <Menu
      visible={abierto}
      onDismiss={() => setAbierto(false)}
      anchor={
        <Button
          mode="text"
          compact
          icon="sort"
          textColor={colors.onSurfaceVariant}
          onPress={() => setAbierto(true)}
          testID="orden-menu"
          accessibilityLabel={`Ordenar: ${seleccionada.etiqueta}`}
        >
          {seleccionada.etiqueta}
        </Button>
      }
    >
      {OPCIONES_ORDEN.map((opcion) => (
        <Menu.Item
          key={`${opcion.ordenarPor}-${opcion.orden}`}
          title={opcion.etiqueta}
          onPress={() => elegir(opcion)}
          leadingIcon={opcion === seleccionada ? "check" : undefined}
          testID={`orden-${opcion.ordenarPor}-${opcion.orden}`}
        />
      ))}
    </Menu>
  );
}
