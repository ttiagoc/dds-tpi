import { Platform } from "react-native";
import { TextInput } from "react-native-paper";

const tecladoPara = (decimal) => {
  if (Platform.OS === "ios") return "numbers-and-punctuation";
  return decimal ? "decimal-pad" : "number-pad";
};

export function CampoNumero({ decimal = false, ...props }) {
  return (
    <TextInput
      mode="outlined"
      keyboardType={tecladoPara(decimal)}
      returnKeyType="done"
      submitBehavior="blurAndSubmit"
      {...props}
    />
  );
}
