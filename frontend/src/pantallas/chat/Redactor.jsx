import { StyleSheet, View } from "react-native";
import { HelperText, IconButton, TextInput, useTheme } from "react-native-paper";
import { Contador } from "../../components/Contador";
import { espaciado, radios } from "../../tema/espaciado";

const MAXIMO = 500;

function BotonEnviar({ chat }) {
  const { colors } = useTheme();
  return (
    <IconButton
      icon="send"
      mode="contained"
      containerColor={colors.primary}
      iconColor={colors.onPrimary}
      size={24}
      disabled={!chat.puedeEnviar}
      loading={chat.enviando}
      onPress={() => {
        chat.enviar();
      }}
      accessibilityLabel="Enviar mensaje"
      testID="chat-enviar"
    />
  );
}

export function Redactor({ chat }) {
  return (
    <View style={estilos.redactor}>
      {chat.errorEnvio && (
        <HelperText type="error" visible testID="chat-error">
          {chat.errorEnvio}
        </HelperText>
      )}
      <View style={estilos.fila}>
        <TextInput
          mode="outlined"
          placeholder="Escribí un mensaje"
          value={chat.texto}
          onChangeText={chat.escribir}
          multiline
          maxLength={MAXIMO}
          editable={!chat.enviando}
          style={estilos.input}
          outlineStyle={estilos.contorno}
          testID="chat-input"
        />
        <BotonEnviar chat={chat} />
      </View>
      <Contador largo={chat.texto.length} maximo={MAXIMO} testID="chat-contador" />
    </View>
  );
}

const estilos = StyleSheet.create({
  redactor: { gap: espaciado.xs },
  fila: { flexDirection: "row", alignItems: "center", gap: espaciado.sm },
  input: { flex: 1, maxHeight: 120 },
  contorno: { borderRadius: radios.lg },
});
