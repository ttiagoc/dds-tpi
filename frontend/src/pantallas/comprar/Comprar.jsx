import { StyleSheet, View } from "react-native";
import { Button, HelperText, Text, useTheme } from "react-native-paper";
import { ConEvento } from "../../components/ConEvento";
import { EstadoVacio } from "../../components/EstadoVacio";
import { FechaYLugar } from "../../components/FechaYLugar";
import { Pantalla } from "../../components/Pantalla";
import { SelectorCantidad } from "../../components/SelectorCantidad";
import { volver } from "../../navegacion/volver";
import { espaciado } from "../../tema/espaciado";
import { formatearPrecio } from "../../utils/formato";
import { TiposAElegir } from "./TiposAElegir";
import { useConfirmar, useSeleccion } from "./useCompra";

function Encabezado({ evento }) {
  const { colors } = useTheme();
  return (
    <View style={estilos.encabezado}>
      <Text variant="headlineSmall">{evento.nombre}</Text>
      <FechaYLugar fecha={evento.fecha} lugar={evento.lugar} />
    </View>
  );
}

function SinEntradas() {
  return (
    <Pantalla>
      <EstadoVacio
        icono="ticket-outline"
        texto="No quedan entradas para este evento"
        accion={{ etiqueta: "Volver", onPress: volver, testID: "volver" }}
        testID="sin-entradas"
      />
    </Pantalla>
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
      <Encabezado evento={evento} />
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
  encabezado: { gap: espaciado.xs },
  cantidad: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
