import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Button, Icon, Modal, Portal, Text, useTheme } from "react-native-paper";
import QRCode from "react-native-qrcode-svg";
import { useBrilloMaximo } from "../../hooks/useBrilloMaximo";
import { espaciado, radios } from "../../tema/espaciado";
import { textoDelQr } from "../../utils/qrDeEntrada";

const TAMANIO_QR = 220;
const ANCHO_INICIAL = TAMANIO_QR + espaciado.xl * 2;
const OPACIDAD_USADA = 0.25;
const TAMANIO_PUNTO = 8;

function coloresDelQr({ dark, colors }) {
  return dark
    ? { color: colors.inverseOnSurface, fondo: colors.inverseSurface }
    : { color: colors.onSurface, fondo: colors.surface };
}

function Usada({ numero }) {
  const { colors } = useTheme();
  return (
    <View style={estilos.usada} testID={`entrada-${numero}-usada`}>
      <Icon source="check-circle" size={18} color={colors.onSurfaceVariant} />
      <Text variant="labelLarge" style={{ color: colors.onSurfaceVariant }}>
        Usada
      </Text>
    </View>
  );
}

function PaginaEntrada({ compraId, entrada, total, ancho }) {
  const tema = useTheme();
  const { color, fondo } = coloresDelQr(tema);
  const usada = entrada.fechaUso !== null;
  return (
    <View style={[estilos.pagina, { width: ancho }]}>
      <Text variant="titleMedium">{`Entrada ${entrada.numero} de ${total}`}</Text>
      <View
        style={[estilos.marco, { backgroundColor: fondo, opacity: usada ? OPACIDAD_USADA : 1 }]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Código QR de la entrada ${entrada.numero} de ${total}`}
      >
        <QRCode
          value={textoDelQr(compraId, entrada.numero)}
          size={TAMANIO_QR}
          color={color}
          backgroundColor={fondo}
        />
      </View>
      {usada && <Usada numero={entrada.numero} />}
    </View>
  );
}

function Puntos({ total, actual }) {
  const { colors } = useTheme();
  if (total < 2) return null;
  return (
    <View
      style={estilos.puntos}
      accessibilityLabel={`Entrada ${actual + 1} de ${total}`}
      testID="compra-qr-pagina"
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            estilos.punto,
            { backgroundColor: i === actual ? colors.primary : colors.outlineVariant },
          ]}
        />
      ))}
    </View>
  );
}

function Entradas({ compra }) {
  const [ancho, setAncho] = useState(ANCHO_INICIAL);
  const [actual, setActual] = useState(0);
  const total = compra.entradas.length;
  return (
    <>
      <View style={estilos.lista} onLayout={(evento) => setAncho(evento.nativeEvent.layout.width)}>
        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={compra.entradas}
          keyExtractor={(entrada) => String(entrada.numero)}
          onMomentumScrollEnd={(evento) =>
            setActual(Math.round(evento.nativeEvent.contentOffset.x / ancho))
          }
          renderItem={({ item }) => (
            <PaginaEntrada compraId={compra.id} entrada={item} total={total} ancho={ancho} />
          )}
          testID="compra-qr-entradas"
        />
      </View>
      <Puntos total={total} actual={actual} />
    </>
  );
}

export function ModalEntradas({ compra, visible, cerrar }) {
  const { colors } = useTheme();
  useBrilloMaximo(visible);
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={cerrar}
        contentContainerStyle={[estilos.modal, { backgroundColor: colors.surface }]}
        testID="compra-qr"
      >
        <Entradas compra={compra} />
        <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
          Mostrá este código en la entrada
        </Text>
        <Button mode="outlined" onPress={cerrar} testID="compra-qr-cerrar">
          Cerrar
        </Button>
      </Modal>
    </Portal>
  );
}

const estilos = StyleSheet.create({
  modal: {
    margin: espaciado.lg,
    paddingVertical: espaciado.xl,
    gap: espaciado.md,
    borderRadius: radios.lg,
    alignItems: "center",
  },
  lista: { alignSelf: "stretch" },
  pagina: { alignItems: "center", gap: espaciado.md },
  marco: { padding: espaciado.md, borderRadius: radios.md },
  usada: { flexDirection: "row", alignItems: "center", gap: espaciado.xs },
  puntos: { flexDirection: "row", gap: espaciado.sm },
  punto: { width: TAMANIO_PUNTO, height: TAMANIO_PUNTO, borderRadius: radios.pill },
});
