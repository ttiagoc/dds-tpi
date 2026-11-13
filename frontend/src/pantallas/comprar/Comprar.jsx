import { StyleSheet, View } from "react-native";
import { Button, HelperText, Text } from "react-native-paper";
import { AvisoConVolver } from "../../components/AvisoConVolver";
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
    <>
      <Text variant="titleLarge" testID="comprar-total">
        {`Total: ${formatearPrecio(total)}`}
      </Text>
      {envio.error && (
        <HelperText type="error" visible testID="comprar-error">
          {envio.error}
        </HelperText>
      )}
      <Button
        mode="contained"
        icon="ticket-outline"
        onPress={() => {
          envio.confirmar();
        }}
        loading={envio.enviando}
        disabled={envio.enviando || actualizando}
        testID="comprar-confirmar"
      >
        Confirmar compra
      </Button>
    </>
  );
}

function Formulario({ evento, actualizando, recargar }) {
  const seleccion = useSeleccion(evento.tiposEntrada);
  const { tipo, cantidad } = seleccion;
  const envio = useConfirmar({ eventoId: evento.id, tipo, cantidad, recargar });
  if (!tipo) return <SinEntradas />;
  return (
    <Pantalla scroll>
      <EncabezadoEvento evento={evento} />
      <TiposAElegir tipos={evento.tiposEntrada} elegido={tipo.id} onElegir={seleccion.elegirTipo} />
      <View style={estilos.cantidad}>
        <Text variant="titleMedium">Cantidad</Text>
        <SelectorCantidad
          valor={cantidad}
          max={seleccion.maximo}
          onCambiar={seleccion.elegirCantidad}
        />
      </View>
      <Confirmacion total={tipo.precio * cantidad} envio={envio} actualizando={actualizando} />
    </Pantalla>
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
});
