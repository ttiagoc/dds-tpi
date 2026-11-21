import { InputAccessoryView, Keyboard, Platform, StyleSheet, View } from "react-native";
import { Button, TextInput, useTheme } from "react-native-paper";
import { espaciado } from "../tema/espaciado";

function BarraListo({ id, testID }) {
  const { colors } = useTheme();
  return (
    <InputAccessoryView nativeID={id}>
      <View
        style={[
          estilos.barra,
          { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
        ]}
      >
        <Button mode="text" onPress={Keyboard.dismiss} testID={testID}>
          Listo
        </Button>
      </View>
    </InputAccessoryView>
  );
}

export function CampoNumero({ decimal = false, testID, ...props }) {
  const conBarra = Platform.OS === "ios";
  const idBarra = `${testID}-teclado`;
  return (
    <>
      <TextInput
        mode="outlined"
        keyboardType={decimal ? "decimal-pad" : "number-pad"}
        returnKeyType="done"
        submitBehavior="blurAndSubmit"
        inputAccessoryViewID={conBarra ? idBarra : undefined}
        testID={testID}
        {...props}
      />
      {conBarra && <BarraListo id={idBarra} testID={`${testID}-listo`} />}
    </>
  );
}

const estilos = StyleSheet.create({
  barra: {
    alignItems: "flex-end",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: espaciado.sm,
  },
});
