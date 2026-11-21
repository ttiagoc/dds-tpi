import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import {
  DatePickerModal,
  TimePickerModal,
  es,
  registerTranslation,
} from "react-native-paper-dates";
import { espaciado } from "../../tema/espaciado";
import { formatearDia } from "../../utils/formato";
import { ErrorCampo } from "./ErrorCampo";

registerTranslation("es", es);

const dosDigitos = (numero) => String(numero).padStart(2, "0");
const textoHora = ({ hours, minutes }) => `${dosDigitos(hours)}:${dosDigitos(minutes)}`;

const inicioDeHoy = () => {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
};

function BotonElegir({ icono, texto, etiqueta, error, onPress, deshabilitado, testID, nodo }) {
  const { colors } = useTheme();
  return (
    <View ref={nodo} style={estilos.columna}>
      <Button
        mode="outlined"
        icon={icono}
        disabled={deshabilitado}
        onPress={onPress}
        style={error ? { borderColor: colors.error } : undefined}
        accessibilityLabel={error ? `${etiqueta}: ${texto}. ${error}` : `${etiqueta}: ${texto}`}
        testID={testID}
      >
        {texto}
      </Button>
      <ErrorCampo mensaje={error} testID={`${testID}-error`} />
    </View>
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
        validRange={{ startDate: inicioDeHoy() }}
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

function useFocoDeLaFila(foco) {
  const fecha = foco.registrar("fecha");
  const hora = foco.registrar("hora");
  const onLayout = (evento) => {
    fecha.onLayout(evento);
    hora.onLayout(evento);
  };
  return { fecha, hora, onLayout };
}

export function SelectorFechaHora({ dia, hora, onDia, onHora, deshabilitado, errores, foco }) {
  const [abierto, setAbierto] = useState(null);
  const fila = useFocoDeLaFila(foco);
  return (
    <View style={estilos.fila} onLayout={fila.onLayout}>
      <BotonElegir
        icono="calendar"
        etiqueta="Fecha"
        texto={dia ? formatearDia(dia) : "Fecha"}
        error={errores.fecha}
        onPress={() => setAbierto("dia")}
        deshabilitado={deshabilitado}
        testID="evento-fecha"
        nodo={fila.fecha.ref}
      />
      <BotonElegir
        icono="clock-outline"
        etiqueta="Hora"
        texto={hora ? textoHora(hora) : "Hora"}
        error={errores.hora}
        onPress={() => setAbierto("hora")}
        deshabilitado={deshabilitado}
        testID="evento-hora"
        nodo={fila.hora.ref}
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
  columna: { flex: 1 },
});
