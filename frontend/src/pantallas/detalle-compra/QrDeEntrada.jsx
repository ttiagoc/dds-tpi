import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Icon, Modal, Portal, Text, useTheme } from "react-native-paper";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../../auth/AuthContext";
import { TarjetaPlana } from "../../components/TarjetaPlana";
import { useBrilloMaximo } from "../../hooks/useBrilloMaximo";
import { espaciado, radios } from "../../tema/espaciado";
import { textoDelQr } from "../../utils/qrDeEntrada";

const TAMANIO_QR = 240;

function coloresDelQr({ dark, colors }) {
  return dark
    ? { color: colors.inverseOnSurface, fondo: colors.inverseSurface }
    : { color: colors.onSurface, fondo: colors.surface };
}

function ModalQr({ compraId, visible, cerrar }) {
  const tema = useTheme();
  const { color, fondo } = coloresDelQr(tema);
  useBrilloMaximo(visible);
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={cerrar}
        contentContainerStyle={[estilos.modal, { backgroundColor: tema.colors.surface }]}
        testID="compra-qr"
      >
        <Text variant="titleLarge">Tu entrada</Text>
        <View
          style={[estilos.marco, { backgroundColor: fondo }]}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Código QR de la compra ${compraId}`}
        >
          <QRCode
            value={textoDelQr(compraId)}
            size={TAMANIO_QR}
            color={color}
            backgroundColor={fondo}
          />
        </View>
        <Text variant="bodyMedium" style={{ color: tema.colors.onSurfaceVariant }}>
          Mostrá este código en la entrada
        </Text>
        <Button mode="outlined" onPress={cerrar} testID="compra-qr-cerrar">
          Cerrar
        </Button>
      </Modal>
    </Portal>
  );
}

function VerQr({ compraId }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button
        mode="contained"
        icon="qrcode"
        onPress={() => setVisible(true)}
        testID="compra-ver-qr"
      >
        Ver QR
      </Button>
      <ModalQr compraId={compraId} visible={visible} cerrar={() => setVisible(false)} />
    </>
  );
}

function Pendiente() {
  const { colors } = useTheme();
  return (
    <TarjetaPlana style={estilos.pendiente} testID="compra-qr-pendiente">
      <Icon source="qrcode" size={24} color={colors.onSurfaceVariant} />
      <Text variant="bodyMedium" style={[estilos.texto, { color: colors.onSurfaceVariant }]}>
        Pagá la compra para ver tu entrada
      </Text>
    </TarjetaPlana>
  );
}

export function QrDeEntrada({ compra }) {
  const { usuario } = useAuth();
  if (usuario?.rol !== "COMPRADOR") return null;
  if (compra.estado === "CONFIRMADA") return <VerQr compraId={compra.id} />;
  if (compra.estado === "PENDIENTE") return <Pendiente />;
  return null;
}

const estilos = StyleSheet.create({
  modal: {
    margin: espaciado.lg,
    padding: espaciado.xl,
    gap: espaciado.md,
    borderRadius: radios.lg,
    alignItems: "center",
  },
  marco: { padding: espaciado.md, borderRadius: radios.md },
  pendiente: {
    padding: espaciado.lg,
    gap: espaciado.md,
    flexDirection: "row",
    alignItems: "center",
  },
  texto: { flex: 1 },
});
