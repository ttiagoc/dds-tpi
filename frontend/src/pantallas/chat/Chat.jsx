import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, HelperText, Icon, Text, useTheme } from "react-native-paper";
import { useAuth } from "../../auth/AuthContext";
import { Cargando } from "../../components/Cargando";
import { ConCompra } from "../../components/ConCompra";
import { ErrorCarga } from "../../components/ErrorCarga";
import { Pantalla } from "../../components/Pantalla";
import { espaciado, radios } from "../../tema/espaciado";
import { Burbuja } from "./Burbuja";
import { paraListaInvertida } from "./conSeparadores";
import { EncabezadoChat } from "./EncabezadoChat";
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

function Encabezado({ compra, chat }) {
  return (
    <View style={estilos.encabezado}>
      <EncabezadoChat compra={compra} />
      {!chat.conectado && <SinConexion onActualizar={chat.recargar} />}
      {chat.cargado && chat.error && (
        <HelperText type="error" visible testID="chat-carga-error">
          {chat.error}
        </HelperText>
      )}
    </View>
  );
}

function VerAnteriores({ chat }) {
  if (!chat.hayAnteriores) return null;
  if (chat.cargandoAnteriores)
    return (
      <ActivityIndicator
        style={estilos.anteriores}
        accessibilityLabel="Cargando mensajes anteriores"
        testID="chat-cargando-anteriores"
      />
    );
  return (
    <View style={estilos.anteriores}>
      <Button mode="text" compact onPress={chat.cargarAnteriores} testID="chat-ver-anteriores">
        Ver mensajes anteriores
      </Button>
      {chat.errorAnteriores && (
        <HelperText type="error" visible testID="chat-anteriores-error">
          {chat.errorAnteriores}
        </HelperText>
      )}
    </View>
  );
}

function SeparadorDia({ dia }) {
  const { colors } = useTheme();
  return (
    <Text
      variant="labelMedium"
      style={[estilos.dia, { color: colors.onSurfaceVariant }]}
      testID={`chat-dia-${dia.clave}`}
    >
      {dia.etiqueta}
    </Text>
  );
}

function SinMensajes({ chat }) {
  if (!chat.cargado)
    return chat.error ? (
      <ErrorCarga mensaje={chat.error} onReintentar={chat.recargar} />
    ) : (
      <Cargando />
    );
  return (
    <Text variant="bodyMedium" style={estilos.vacio} testID="chat-vacio">
      Todavía no hay mensajes
    </Text>
  );
}

function Mensajes({ chat }) {
  const { usuario } = useAuth();
  if (!chat.cargado || chat.mensajes.length === 0) return <SinMensajes chat={chat} />;
  return (
    <FlatList
      inverted
      data={paraListaInvertida(chat.mensajes)}
      keyExtractor={(item) => item.clave}
      renderItem={({ item }) =>
        item.dia ? (
          <SeparadorDia dia={item.dia} />
        ) : (
          <Burbuja mensaje={item.mensaje} propia={item.mensaje.usuario.id === usuario?.id} />
        )
      }
      ListFooterComponent={<VerAnteriores chat={chat} />}
      onEndReached={chat.alLlegarArriba}
      onEndReachedThreshold={0.3}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={estilos.mensajes}
      testID="lista-mensajes"
    />
  );
}

function Conversacion({ compra }) {
  const chat = useChatCompra(compra.id);
  return (
    <KeyboardAvoidingView
      style={estilos.pantalla}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pantalla bordes={["top", "bottom"]}>
        <Encabezado compra={compra} chat={chat} />
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
  encabezado: { gap: espaciado.md },
  mensajes: { gap: espaciado.sm, paddingVertical: espaciado.sm },
  vacio: { textAlign: "center", paddingVertical: espaciado.xl },
  dia: { alignSelf: "center", paddingVertical: espaciado.xs },
  anteriores: { alignItems: "center", paddingVertical: espaciado.xs },
  sinConexion: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaciado.sm,
    paddingLeft: espaciado.md,
    borderRadius: radios.md,
  },
  textoSinConexion: { flex: 1 },
});
