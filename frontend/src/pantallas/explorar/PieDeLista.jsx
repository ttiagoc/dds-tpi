import { StyleSheet, View } from "react-native";
import { Button, HelperText } from "react-native-paper";
import { espaciado } from "../../tema/espaciado";

export function PieDeLista({ hayMas, cargandoMas, errorMas, onCargarMas }) {
  if (!hayMas) return null;
  return (
    <View style={estilos.pie}>
      {errorMas && (
        <HelperText type="error" visible>
          {errorMas}
        </HelperText>
      )}
      <Button
        mode="outlined"
        onPress={onCargarMas}
        loading={cargandoMas}
        disabled={cargandoMas}
        testID="cargar-mas"
      >
        {errorMas ? "Reintentar" : "Cargar más"}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  pie: { paddingVertical: espaciado.md, alignItems: "center" },
});
