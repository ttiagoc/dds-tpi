import { View } from "react-native";
import { Button, HelperText } from "react-native-paper";

export function ErrorEnLinea({ mensaje, onReintentar, testID }) {
  return (
    <View>
      <HelperText type="error" visible testID={testID}>
        {mensaje}
      </HelperText>
      <Button mode="text" onPress={onReintentar}>
        Reintentar
      </Button>
    </View>
  );
}
