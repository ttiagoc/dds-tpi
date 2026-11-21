import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Menu, Text, useTheme } from "react-native-paper";
import { listarCategorias } from "../../api/categoriasApi";
import { ErrorEnLinea } from "../../components/ErrorEnLinea";
import { useCargar } from "../../hooks/useCargar";
import { espaciado } from "../../tema/espaciado";
import { ErrorCampo } from "./ErrorCampo";

function BotonCategoria({ texto, error, deshabilitado, onPress }) {
  const { colors } = useTheme();
  return (
    <Button
      mode="outlined"
      icon="shape-outline"
      disabled={deshabilitado}
      onPress={onPress}
      style={error ? { borderColor: colors.error } : undefined}
      accessibilityLabel={error ? `Categoría: ${texto}. ${error}` : `Categoría: ${texto}`}
      testID="evento-categoria"
    >
      {texto}
    </Button>
  );
}

export function SelectorCategoria({ categoria, onElegir, deshabilitado, error, foco }) {
  const [abierto, setAbierto] = useState(false);
  const { datos: categorias, error: errorCarga, recargar } = useCargar(listarCategorias);
  if (errorCarga)
    return <ErrorEnLinea mensaje={errorCarga} onReintentar={recargar} testID="categorias-error" />;
  if (!categorias)
    return <ActivityIndicator size="small" accessibilityLabel="Cargando categorías" />;
  return (
    <View {...foco.registrar("categoria")} style={estilos.campo}>
      <Text variant="labelLarge">Categoría</Text>
      <Menu
        visible={abierto}
        onDismiss={() => setAbierto(false)}
        anchor={
          <BotonCategoria
            texto={categoria?.nombre ?? "Elegí una categoría"}
            error={error}
            deshabilitado={deshabilitado}
            onPress={() => setAbierto(true)}
          />
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
      <ErrorCampo mensaje={error} testID="evento-categoria-error" />
    </View>
  );
}

const estilos = StyleSheet.create({ campo: { gap: espaciado.xs } });
