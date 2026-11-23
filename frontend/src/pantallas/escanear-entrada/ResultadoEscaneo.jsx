import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, HelperText, Icon, Text, useTheme } from "react-native-paper";
import { ChipEstado } from "../../components/ChipEstado";
import { TarjetaPlana } from "../../components/TarjetaPlana";
import { espaciado } from "../../tema/espaciado";
import { entradaDe } from "./useEscaneo";

const MOTIVOS = {
  PENDIENTE: "Esta compra todavía no está pagada",
  CANCELADA: "Esta compra está cancelada",
  REEMBOLSADA: "Esta compra está cancelada",
};
const MOTIVO_USADA = "Esta entrada ya fue utilizada";
const MOTIVO_GENERICO = "No podés validar esta entrada";

function motivoDe(compra, entrada) {
  if (entrada.fechaUso !== null) return MOTIVO_USADA;
  return MOTIVOS[compra.estado] ?? MOTIVO_GENERICO;
}

function textoQuedan(compra) {
  const quedan = compra.entradas.filter((entrada) => entrada.fechaUso === null).length;
  if (quedan === 0) return null;
  return quedan === 1
    ? "Queda 1 entrada de esta compra"
    : `Quedan ${quedan} entradas de esta compra`;
}

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

function DatosDeLaCompra({ escaneo }) {
  const { colors } = useTheme();
  const { compra, numero } = escaneo;
  return (
    <View style={estilos.datos}>
      <Text variant="titleMedium">{compra.comprador.nombre}</Text>
      <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
        {`Entrada ${numero} de ${compra.cantidad} · ${compra.tipoEntrada.nombre}`}
      </Text>
      <ChipEstado estado={compra.estado} />
    </View>
  );
}

function Validada({ compra }) {
  const { colors } = useTheme();
  const quedan = textoQuedan(compra);
  return (
    <>
      <Mensaje
        icono="check-circle"
        color={colors.primary}
        texto="Entrada validada"
        testID="escaner-validada"
      />
      {quedan && (
        <Text
          variant="bodyMedium"
          style={{ color: colors.onSurfaceVariant }}
          testID="escaner-quedan"
        >
          {quedan}
        </Text>
      )}
    </>
  );
}

function Validar({ escaneo }) {
  const { colors } = useTheme();
  const entrada = entradaDe(escaneo);
  if (!entrada.puedeValidarse) {
    const motivo = motivoDe(escaneo.compra, entrada);
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
  return (
    <>
      <DatosDeLaCompra escaneo={escaneo} />
      {escaneo.fase === "validada" ? (
        <Validada compra={escaneo.compra} />
      ) : (
        <Validar escaneo={escaneo} />
      )}
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
