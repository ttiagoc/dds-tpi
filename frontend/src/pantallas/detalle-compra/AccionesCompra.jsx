import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Dialog, HelperText, Portal, Text, useTheme } from "react-native-paper";
import { espaciado } from "../../tema/espaciado";
import { formatearPrecio } from "../../utils/formato";

function textoDeCancelacion({ estado, cantidad, total }) {
  const entradas = cantidad === 1 ? "Se libera la entrada" : `Se liberan las ${cantidad} entradas`;
  return estado === "CONFIRMADA"
    ? `${entradas} y se te reembolsan ${formatearPrecio(total)}.`
    : `${entradas}.`;
}

function DialogoCancelacion({ compra, visible, onVolver, onConfirmar }) {
  const { colors } = useTheme();
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onVolver}>
        <Dialog.Title>¿Cancelar la compra?</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{textoDeCancelacion(compra)}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onVolver}>Volver</Button>
          <Button textColor={colors.error} onPress={onConfirmar} testID="confirmar-cancelacion">
            Cancelar compra
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function Botones({ puedePagar, puedeCancelar, enCurso, onPagar, onCancelar }) {
  const { colors } = useTheme();
  return (
    <>
      {puedePagar && (
        <Button
          mode="contained"
          icon="credit-card-outline"
          loading={enCurso === "pagar"}
          disabled={!!enCurso}
          onPress={onPagar}
          testID="compra-pagar"
        >
          Pagar
        </Button>
      )}
      {puedeCancelar && (
        <Button
          mode="outlined"
          textColor={colors.error}
          loading={enCurso === "cancelar"}
          disabled={!!enCurso}
          onPress={onCancelar}
          testID="compra-cancelar"
        >
          Cancelar compra
        </Button>
      )}
    </>
  );
}

export function AccionesCompra({ compra, acciones }) {
  const [confirmando, setConfirmando] = useState(false);
  const { puedePagar, puedeCancelar } = compra.acciones ?? {};
  const { enCurso, error, pagar, cancelar } = acciones;
  if (!puedePagar && !puedeCancelar && !error) return null;

  return (
    <View style={estilos.acciones}>
      <Botones
        puedePagar={puedePagar}
        puedeCancelar={puedeCancelar}
        enCurso={enCurso}
        onPagar={() => {
          pagar();
        }}
        onCancelar={() => setConfirmando(true)}
      />
      {error && (
        <HelperText type="error" visible testID="compra-accion-error">
          {error}
        </HelperText>
      )}
      <DialogoCancelacion
        compra={compra}
        visible={confirmando}
        onVolver={() => setConfirmando(false)}
        onConfirmar={() => {
          setConfirmando(false);
          cancelar();
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  acciones: { gap: espaciado.sm },
});
