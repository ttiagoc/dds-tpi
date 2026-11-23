import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, HelperText, Icon, Text, useTheme } from "react-native-paper";
import { ChipEstado } from "../../components/ChipEstado";
import { TarjetaPlana } from "../../components/TarjetaPlana";
import { espaciado } from "../../tema/espaciado";

const MOTIVOS = {
  UTILIZADA: "Esta entrada ya fue utilizada",
  PENDIENTE: "Esta compra todavía no está pagada",
  CANCELADA: "Esta compra está cancelada",
  REEMBOLSADA: "Esta compra está cancelada",
};
const MOTIVO_GENERICO = "No podés validar esta entrada";

function EscanearOtra({ onPress }) {
  return (
    <Button mode="outlined" icon="qrcode-scan" onPress={onPress} testID="escaner-otra">
      Escanear otra
    </Button>
  );
}

function Mensaje({ icono, color, texto, testID }) {
  return (
    <View style={estilos.fila} testID={testID}>
      <Icon source={icono} size={24} color={color} />
      <Text variant="bodyLarge" style={estilos.texto}>
        {texto}
      </Text>
    </View>
  );
}

function DatosDeLaCompra({ compra }) {
  const { colors } = useTheme();
  return (
    <View style={estilos.datos}>
      <Text variant="titleMedium">{compra.comprador.nombre}</Text>
      <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
        {`${compra.tipoEntrada.nombre} × ${compra.cantidad}`}
      </Text>
      <ChipEstado estado={compra.estado} />
    </View>
  );
}

function Validar({ escaneo }) {
  const { colors } = useTheme();
  if (!escaneo.compra.acciones.puedeMarcarUtilizada) {
    const motivo = MOTIVOS[escaneo.compra.estado] ?? MOTIVO_GENERICO;
    return (
      <Mensaje
        icono="alert-circle-outline"
        color={colors.error}
        texto={motivo}
        testID="escaner-motivo"
      />
    );
  }
  return (
    <>
      <Button
        mode="contained"
        icon="ticket-confirmation-outline"
        onPress={escaneo.validar}
        loading={escaneo.validando}
        disabled={escaneo.validando}
        testID="escaner-validar"
      >
        Validar entrada
      </Button>
      {escaneo.errorAlValidar && (
        <HelperText type="error" visible testID="escaner-error">
          {escaneo.errorAlValidar}
        </HelperText>
      )}
    </>
  );
}

function Contenido({ escaneo }) {
  const { colors } = useTheme();
  if (escaneo.fase === "buscando") {
    return <ActivityIndicator accessibilityLabel="Buscando la compra" testID="escaner-buscando" />;
  }
  if (escaneo.fase === "error") {
    return (
      <Mensaje
        icono="alert-circle-outline"
        color={colors.error}
        texto={escaneo.error}
        testID="escaner-error"
      />
    );
  }
  if (escaneo.fase === "validada") {
    return (
      <>
        <DatosDeLaCompra compra={escaneo.compra} />
        <Mensaje
          icono="check-circle"
          color={colors.primary}
          texto="Entrada validada"
          testID="escaner-validada"
        />
      </>
    );
  }
  return (
    <>
      <DatosDeLaCompra compra={escaneo.compra} />
      <Validar escaneo={escaneo} />
    </>
  );
}

export function ResultadoEscaneo({ escaneo }) {
  return (
    <TarjetaPlana style={estilos.tarjeta} testID="escaner-resultado">
      <Contenido escaneo={escaneo} />
      {escaneo.fase !== "buscando" && <EscanearOtra onPress={escaneo.escanearOtra} />}
    </TarjetaPlana>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { padding: espaciado.lg, gap: espaciado.md },
  datos: { gap: espaciado.xs, alignItems: "flex-start" },
  fila: { flexDirection: "row", alignItems: "center", gap: espaciado.sm },
  texto: { flex: 1 },
});
