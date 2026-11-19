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

function VerAnteriores({ chat }) {
  if (!chat.hayAnteriores) return null;
  return (
    <View style={estilos.anteriores}>
      <Button
        mode="text"
        compact
        onPress={chat.cargarAnteriores}
        loading={chat.cargandoAnteriores}
        disabled={chat.cargandoAnteriores}
        testID="chat-ver-anteriores"
      >
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

function CabeceraDeMensajes({ encabezado, chat }) {
  return (
    <>
      {encabezado}
      {chat.error && (
        <HelperText type="error" visible testID="chat-carga-error">
          {chat.error}
        </HelperText>
      )}
      <VerAnteriores chat={chat} />
    </>
  );
}

function SinMensajesCargados({ chat, encabezado }) {
  return (
    <>
      {encabezado}
      {chat.error ? <ErrorCarga mensaje={chat.error} onReintentar={chat.recargar} /> : <Cargando />}
    </>
  );
}

function Mensajes({ chat, encabezado }) {
  const { usuario } = useAuth();
  const lista = useRef(null);
  if (!chat.cargado) return <SinMensajesCargados chat={chat} encabezado={encabezado} />;
  return (
    <FlatList
      ref={lista}
      ListHeaderComponent={<CabeceraDeMensajes encabezado={encabezado} chat={chat} />}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
      data={chat.mensajes}
      keyExtractor={(m) => String(m.id)}
      renderItem={({ item }) => <Burbuja mensaje={item} propia={item.usuario.id === usuario?.id} />}
      contentContainerStyle={estilos.mensajes}
      onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
      ListEmptyComponent={
        <Text variant="bodyMedium" style={estilos.vacio} testID="chat-vacio">
          Todavía no hay mensajes
        </Text>
      }
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
      <Pantalla bordes={["bottom"]}>
        <View style={estilos.pantalla}>
          <Mensajes
            chat={chat}
            encabezado={
              <View style={estilos.encabezado}>
                <EncabezadoEvento evento={compra.evento} />
                {!chat.conectado && <SinConexion onActualizar={chat.recargar} />}
              </View>
            }
          />
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
  encabezado: { gap: espaciado.md, paddingBottom: espaciado.sm },
  mensajes: { gap: espaciado.sm, paddingVertical: espaciado.sm },
  vacio: { textAlign: "center", paddingVertical: espaciado.xl },
  anteriores: { alignItems: "center" },
  sinConexion: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaciado.sm,
    paddingLeft: espaciado.md,
    borderRadius: radios.md,
  },
  textoSinConexion: { flex: 1 },
});
