import { StyleSheet, View } from "react-native";
import { Button, HelperText, Text } from "react-native-paper";
import { AvisoConVolver } from "../../components/AvisoConVolver";
import { BarraInferior } from "../../components/BarraInferior";
import { ConEvento } from "../../components/ConEvento";
import { EncabezadoEvento } from "../../components/EncabezadoEvento";
import { Pantalla } from "../../components/Pantalla";
import { SelectorCantidad } from "../../components/SelectorCantidad";
import { espaciado } from "../../tema/espaciado";
import { formatearPrecio } from "../../utils/formato";
import { TiposAElegir } from "./TiposAElegir";
import { useConfirmar, useSeleccion } from "./useCompra";

function SinEntradas() {
  return (
    <AvisoConVolver
      icono="ticket-outline"
      texto="No quedan entradas para este evento"
      testID="sin-entradas"
    />
  );
}

function Confirmacion({ total, envio, actualizando }) {
  return (
    <BarraInferior>
      {envio.error && (
        <HelperText type="error" visible testID="comprar-error">
          {envio.error}
        </HelperText>
      )}
      <View style={estilos.fila}>
        <Text variant="titleLarge" style={estilos.total} testID="comprar-total">
          {`Total: ${formatearPrecio(total)}`}
        </Text>
        <Button
          mode="contained"
          onPress={() => {
            envio.confirmar();
          }}
          loading={envio.enviando}
          disabled={envio.enviando || actualizando}
          contentStyle={estilos.boton}
          testID="comprar-confirmar"
        >
          Confirmar
        </Button>
      </View>
    </BarraInferior>
  );
}

function Formulario({ evento, actualizando, recargar }) {
  const seleccion = useSeleccion(evento.tiposEntrada);
  const { tipo, cantidad } = seleccion;
  const envio = useConfirmar({ eventoId: evento.id, tipo, cantidad, recargar });
  if (!tipo) return <SinEntradas />;
  return (
    <>
      <Pantalla scroll>
        <EncabezadoEvento evento={evento} />
        <TiposAElegir
          tipos={evento.tiposEntrada}
          elegido={tipo.id}
          onElegir={seleccion.elegirTipo}
        />
        <View style={estilos.cantidad}>
          <Text variant="titleMedium">Cantidad</Text>
          <SelectorCantidad
            valor={cantidad}
            max={seleccion.maximo}
            onCambiar={seleccion.elegirCantidad}
          />
        </View>
      </Pantalla>
      <Confirmacion total={tipo.precio * cantidad} envio={envio} actualizando={actualizando} />
    </>
  );
}

export default function Comprar() {
  return (
    <ConEvento>
      {(evento, carga) => (
        <Formulario evento={evento} actualizando={carga.cargando} recargar={carga.recargar} />
      )}
    </ConEvento>
  );
}

const estilos = StyleSheet.create({
  cantidad: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fila: { flexDirection: "row", alignItems: "center", gap: espaciado.lg },
  total: { flex: 1 },
  boton: { paddingHorizontal: espaciado.md, minHeight: 48 },
});
