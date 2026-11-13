import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import {
  DatePickerModal,
  TimePickerModal,
  es,
  registerTranslation,
} from "react-native-paper-dates";
import { espaciado } from "../../tema/espaciado";
import { formatearDia } from "../../utils/formato";

registerTranslation("es", es);

const dosDigitos = (numero) => String(numero).padStart(2, "0");
const textoHora = ({ hours, minutes }) => `${dosDigitos(hours)}:${dosDigitos(minutes)}`;

function BotonElegir({ icono, texto, onPress, deshabilitado, testID }) {
  return (
    <Button
      mode="outlined"
      icon={icono}
      disabled={deshabilitado}
      onPress={onPress}
      style={estilos.boton}
      testID={testID}
    >
      {texto}
    </Button>
  );
}

function Modales({ abierto, dia, hora, onDia, onHora, cerrar }) {
  return (
    <>
      <DatePickerModal
        locale="es"
        mode="single"
        visible={abierto === "dia"}
        date={dia ?? undefined}
        onDismiss={cerrar}
        onConfirm={({ date }) => {
          cerrar();
          if (date) onDia(date);
        }}
      />
      <TimePickerModal
        locale="es"
        visible={abierto === "hora"}
        hours={hora?.hours}
        minutes={hora?.minutes}
        use24HourClock
        onDismiss={cerrar}
        onConfirm={(elegida) => {
          cerrar();
          onHora(elegida);
        }}
      />
    </>
  );
}

export function SelectorFechaHora({ dia, hora, onDia, onHora, deshabilitado }) {
  const [abierto, setAbierto] = useState(null);
  return (
    <View style={estilos.fila}>
      <BotonElegir
        icono="calendar"
        texto={dia ? formatearDia(dia) : "Fecha"}
        onPress={() => setAbierto("dia")}
        deshabilitado={deshabilitado}
        testID="evento-fecha"
      />
      <BotonElegir
        icono="clock-outline"
        texto={hora ? textoHora(hora) : "Hora"}
        onPress={() => setAbierto("hora")}
        deshabilitado={deshabilitado}
        testID="evento-hora"
      />
      <Modales
        abierto={abierto}
        dia={dia}
        hora={hora}
        onDia={onDia}
        onHora={onHora}
        cerrar={() => setAbierto(null)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", gap: espaciado.sm },
  boton: { flex: 1 },
});
