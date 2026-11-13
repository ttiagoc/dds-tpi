import { useRef } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, HelperText, Icon, Text, useTheme } from "react-native-paper";
import { useAuth } from "../../auth/AuthContext";
import { Cargando } from "../../components/Cargando";
import { ConCompra } from "../../components/ConCompra";
import { EncabezadoEvento } from "../../components/EncabezadoEvento";
import { ErrorCarga } from "../../components/ErrorCarga";
import { Pantalla } from "../../components/Pantalla";
import { espaciado, radios } from "../../tema/espaciado";
import { Burbuja } from "./Burbuja";
import { Redactor } from "./Redactor";
import { useChatCompra } from "./useChatCompra";

function SinConexion({ onActualizar }) {
  const { colors } = useTheme();
  return (
    <View
      style={[estilos.sinConexion, { backgroundColor: colors.surfaceVariant }]}
      testID="chat-sin-conexion"
    >
      <Icon source="wifi-off" size={18} color={colors.onSurfaceVariant} />
      <Text
        variant="bodySmall"
        style={[estilos.textoSinConexion, { color: colors.onSurfaceVariant }]}
      >
        Sin conexión en vivo
      </Text>
      <Button mode="text" compact onPress={onActualizar} testID="chat-actualizar">
        Actualizar
      </Button>
    </View>
  );
}

function Mensajes({ chat }) {
  const { usuario } = useAuth();
  const lista = useRef(null);
  if (!chat.cargado && chat.error) {
    return <ErrorCarga mensaje={chat.error} onReintentar={chat.recargar} />;
  }
  if (!chat.cargado) return <Cargando />;
  return (
    <>
      {chat.error && (
        <HelperText type="error" visible testID="chat-carga-error">
          {chat.error}
        </HelperText>
      )}
      <FlatList
        ref={lista}
        data={chat.mensajes}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => (
          <Burbuja mensaje={item} propia={item.usuario.id === usuario?.id} />
        )}
        contentContainerStyle={estilos.mensajes}
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <Text variant="bodyMedium" style={estilos.vacio} testID="chat-vacio">
            Todavía no hay mensajes
          </Text>
        }
        testID="lista-mensajes"
      />
    </>
  );
}

function Conversacion({ compra }) {
  const chat = useChatCompra(compra.id);
  return (
    <KeyboardAvoidingView
      style={estilos.pantalla}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pantalla bordes={["bottom"]}>
        <EncabezadoEvento evento={compra.evento} />
        {!chat.conectado && <SinConexion onActualizar={chat.recargar} />}
        <View style={estilos.pantalla}>
          <Mensajes chat={chat} />
        </View>
        <Redactor chat={chat} />
      </Pantalla>
    </KeyboardAvoidingView>
  );
}

export default function Chat() {
  return <ConCompra>{(compra) => <Conversacion compra={compra} />}</ConCompra>;
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  mensajes: { gap: espaciado.sm, paddingVertical: espaciado.sm },
  vacio: { textAlign: "center", paddingVertical: espaciado.xl },
  sinConexion: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaciado.sm,
    paddingLeft: espaciado.md,
    borderRadius: radios.md,
  },
  textoSinConexion: { flex: 1 },
});
