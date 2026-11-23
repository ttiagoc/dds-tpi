import { StyleSheet, View } from "react-native";
import { Icon, Text, useTheme } from "react-native-paper";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../../auth/AuthContext";
import { TarjetaPlana } from "../../components/TarjetaPlana";
import { espaciado, radios } from "../../tema/espaciado";
import { textoDelQr } from "../../utils/qrDeEntrada";

const TAMANIO_QR = 200;

function coloresDelQr({ dark, colors }) {
  return dark
    ? { color: colors.inverseOnSurface, fondo: colors.inverseSurface }
    : { color: colors.onSurface, fondo: colors.surface };
}

function Codigo({ compraId }) {
  const tema = useTheme();
  const { color, fondo } = coloresDelQr(tema);
  return (
    <TarjetaPlana style={estilos.tarjeta} testID="compra-qr">
      <Text variant="titleMedium">Tu entrada</Text>
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
    </TarjetaPlana>
  );
}

function Pendiente() {
  const { colors } = useTheme();
  return (
    <TarjetaPlana style={[estilos.tarjeta, estilos.fila]} testID="compra-qr-pendiente">
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
  if (compra.estado === "CONFIRMADA") return <Codigo compraId={compra.id} />;
  if (compra.estado === "PENDIENTE") return <Pendiente />;
  return null;
}

const estilos = StyleSheet.create({
  tarjeta: { padding: espaciado.lg, gap: espaciado.md, alignItems: "center" },
  fila: { flexDirection: "row" },
  marco: { padding: espaciado.md, borderRadius: radios.md },
  texto: { flex: 1 },
});
