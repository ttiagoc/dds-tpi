import { StyleSheet } from "react-native";
import { HelperText } from "react-native-paper";

export function Contador({ largo, maximo, testID }) {
  return (
    <HelperText type="info" visible style={estilos.contador} testID={testID}>
      {`${largo}/${maximo}`}
    </HelperText>
  );
}

const estilos = StyleSheet.create({ contador: { textAlign: "right" } });
