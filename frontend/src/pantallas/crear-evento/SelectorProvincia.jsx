import { useState } from "react";
import { Button, Menu, useTheme } from "react-native-paper";
import { PROVINCIAS } from "../../utils/provincias";

export function SelectorProvincia({ provincia, onElegir, error, deshabilitado, nodo }) {
  const { colors } = useTheme();
  const [abierto, setAbierto] = useState(false);
  const texto = provincia ?? "Elegí la provincia";
  return (
    <Menu
      visible={abierto}
      onDismiss={() => setAbierto(false)}
      anchor={
        <Button
          ref={nodo}
          mode="outlined"
          icon="map-outline"
          disabled={deshabilitado}
          onPress={() => setAbierto(true)}
          style={error ? { borderColor: colors.error } : undefined}
          accessibilityLabel={error ? `Provincia: ${texto}. ${error}` : `Provincia: ${texto}`}
          testID="direccion-provincia"
        >
          {texto}
        </Button>
      }
    >
      {PROVINCIAS.map((opcion) => (
        <Menu.Item
          key={opcion}
          title={opcion}
          onPress={() => {
            setAbierto(false);
            onElegir(opcion);
          }}
          testID={`provincia-${opcion}`}
        />
      ))}
    </Menu>
  );
}
