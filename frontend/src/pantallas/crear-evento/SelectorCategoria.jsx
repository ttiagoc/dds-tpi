import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Menu, Text } from "react-native-paper";
import { listarCategorias } from "../../api/categoriasApi";
import { ErrorEnLinea } from "../../components/ErrorEnLinea";
import { useCargar } from "../../hooks/useCargar";
import { espaciado } from "../../tema/espaciado";

export function SelectorCategoria({ categoria, onElegir, deshabilitado }) {
  const [abierto, setAbierto] = useState(false);
  const { datos: categorias, error, recargar } = useCargar(listarCategorias);
  if (error)
    return <ErrorEnLinea mensaje={error} onReintentar={recargar} testID="categorias-error" />;
  if (!categorias)
    return <ActivityIndicator size="small" accessibilityLabel="Cargando categorías" />;
  return (
    <View style={estilos.campo}>
      <Text variant="labelLarge">Categoría</Text>
      <Menu
        visible={abierto}
        onDismiss={() => setAbierto(false)}
        anchor={
          <Button
            mode="outlined"
            icon="shape-outline"
            disabled={deshabilitado}
            onPress={() => setAbierto(true)}
            testID="evento-categoria"
          >
            {categoria?.nombre ?? "Elegí una categoría"}
          </Button>
        }
      >
        {categorias.map((opcion) => (
          <Menu.Item
            key={opcion.id}
            title={opcion.nombre}
            onPress={() => {
              setAbierto(false);
              onElegir(opcion);
            }}
            testID={`categoria-${opcion.id}`}
          />
        ))}
      </Menu>
    </View>
  );
}

const estilos = StyleSheet.create({ campo: { gap: espaciado.xs } });
