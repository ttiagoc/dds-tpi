import { StyleSheet, View } from "react-native";
import { Button, HelperText } from "react-native-paper";
import { espaciado } from "../tema/espaciado";

function MensajeError({ children }) {
  if (!children) return null;
  return (
    <HelperText type="error" visible>
      {children}
    </HelperText>
  );
}

export function PieDeLista({ hayMas, cargandoMas, errorMas, errorRefresco, onCargarMas }) {
  if (!hayMas) {
    return errorRefresco ? (
      <View style={estilos.pie}>
        <MensajeError>{errorRefresco}</MensajeError>
      </View>
    ) : null;
  }
  return (
    <View style={estilos.pie}>
      <MensajeError>{errorRefresco}</MensajeError>
      <MensajeError>{errorMas}</MensajeError>
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
