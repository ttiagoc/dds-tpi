import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Dialog, HelperText, Portal, Text, useTheme } from "react-native-paper";
import { espaciado } from "../../tema/espaciado";
import { ACCIONES_COMPRA, accionDeCompra, accionVisible } from "./catalogoAcciones";

function DialogoConfirmacion({ compra, confirmando, onVolver, onConfirmar }) {
  const { colors } = useTheme();
  const accion = accionDeCompra(confirmando.nombre);
  if (!accion) return null;
  const { titulo, texto, boton, testID } = accion.confirmacion;
  return (
    <Portal>
      <Dialog visible={confirmando.visible} onDismiss={onVolver}>
        <Dialog.Title>{titulo}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{texto(compra)}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onVolver}>Volver</Button>
          <Button
            textColor={accion.destructiva ? colors.error : undefined}
            onPress={() => onConfirmar(accion.nombre)}
            testID={testID}
          >
            {boton}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function BotonAccion({ accion, enCurso, onAccion }) {
  const { colors } = useTheme();
  return (
    <Button
      mode={accion.modo ?? "contained"}
      icon={accion.icono}
      textColor={accion.destructiva ? colors.error : undefined}
      loading={enCurso === accion.nombre}
      disabled={!!enCurso}
      onPress={() => onAccion(accion)}
      testID={accion.testID}
    >
      {accion.etiqueta}
    </Button>
  );
}

function Botones({ permitidas, enCurso, onAccion }) {
  return ACCIONES_COMPRA.filter((accion) => accionVisible(accion, permitidas)).map((accion) => (
    <BotonAccion key={accion.nombre} accion={accion} enCurso={enCurso} onAccion={onAccion} />
  ));
}

export function AccionesCompra({ compra, acciones }) {
  const [confirmando, setConfirmando] = useState({ nombre: null, visible: false });
  const permitidas = compra.acciones ?? {};
  const { enCurso, error, ejecutar } = acciones;
  const cerrar = () => setConfirmando((actual) => ({ ...actual, visible: false }));

  return (
    <View style={estilos.acciones}>
      <Botones
        permitidas={permitidas}
        enCurso={enCurso}
        onAccion={(accion) => {
          if (accion.ruta) router.push(accion.ruta(compra));
          else if (accion.confirmacion) setConfirmando({ nombre: accion.nombre, visible: true });
          else ejecutar(accion.nombre);
        }}
      />
      {error && (
        <HelperText type="error" visible testID="compra-accion-error">
          {error}
        </HelperText>
      )}
      <DialogoConfirmacion
        compra={compra}
        confirmando={confirmando}
        onVolver={cerrar}
        onConfirmar={(nombre) => {
          cerrar();
          ejecutar(nombre);
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  acciones: { gap: espaciado.sm },
});
