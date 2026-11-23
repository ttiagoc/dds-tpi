import { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, Icon, Text, useTheme } from "react-native-paper";
import { useAuth } from "../../auth/AuthContext";
import { TarjetaPlana } from "../../components/TarjetaPlana";
import { espaciado } from "../../tema/espaciado";
import { ModalEntradas } from "./ModalEntradas";

const CON_ENTRADAS = ["CONFIRMADA", "UTILIZADA"];

function VerEntradas({ compra }) {
  const [visible, setVisible] = useState(false);
  const cantidad = compra.entradas.length;
  return (
    <>
      <Button
        mode="contained"
        icon="qrcode"
        onPress={() => setVisible(true)}
        testID="compra-ver-qr"
      >
        {cantidad === 1 ? "Ver QR" : `Ver las ${cantidad} entradas`}
      </Button>
      <ModalEntradas compra={compra} visible={visible} cerrar={() => setVisible(false)} />
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
  if (CON_ENTRADAS.includes(compra.estado)) return <VerEntradas compra={compra} />;
  if (compra.estado === "PENDIENTE") return <Pendiente />;
  return null;
}

const estilos = StyleSheet.create({
  pendiente: {
    padding: espaciado.lg,
    gap: espaciado.md,
    flexDirection: "row",
    alignItems: "center",
  },
  texto: { flex: 1 },
});
