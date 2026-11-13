import { StyleSheet, View } from "react-native";
import { Card, Divider, Snackbar, Text, useTheme } from "react-native-paper";
import { router } from "expo-router";
import { useAuth } from "../../auth/AuthContext";
import { ChipEstado } from "../../components/ChipEstado";
import { ConCompra } from "../../components/ConCompra";
import { Estrellas } from "../../components/Estrellas";
import { FechaYLugar } from "../../components/FechaYLugar";
import { ImagenEvento } from "../../components/ImagenEvento";
import { LineaDeTiempo } from "../../components/LineaDeTiempo";
import { Pantalla } from "../../components/Pantalla";
import { useAvisoDeRuta } from "../../hooks/useAvisoDeRuta";
import { useRecargarAlVolver } from "../../hooks/useRecargarAlVolver";
import { useSalaDeCompra } from "../../hooks/useSalaDeCompra";
import { espaciado } from "../../tema/espaciado";
import { formatearFecha, formatearPrecio, textoDiasRestantes } from "../../utils/formato";
import { AccionesCompra } from "./AccionesCompra";
import { useAccionesCompra } from "./useAccionesCompra";

function Estado({ compra }) {
  const { colors } = useTheme();
  const dias = textoDiasRestantes(compra.diasRestantes);
  return (
    <View style={estilos.estado} testID="compra-estado">
      <ChipEstado estado={compra.estado} />
      {dias && (
        <Text variant="titleMedium" style={{ color: colors.primary }} testID="dias-restantes">
          {dias}
        </Text>
      )}
    </View>
  );
}

function Evento({ evento }) {
  return (
    <Card
      mode="outlined"
      onPress={() => router.push(`/eventos/${evento.id}`)}
      testID="compra-evento"
      accessibilityLabel={`Ver el evento ${evento.nombre}`}
    >
      <ImagenEvento uri={evento.imagen} nombre={evento.nombre} />
      <Card.Content style={estilos.evento}>
        <Text variant="titleMedium">{evento.nombre}</Text>
        <FechaYLugar fecha={evento.fecha} lugar={evento.lugar} />
      </Card.Content>
    </Card>
  );
}

function Resumen({ compra }) {
  const { colors } = useTheme();
  const { tipoEntrada, cantidad, total, fechaCompra } = compra;
  return (
    <View style={estilos.resumen}>
      <Text variant="bodyLarge">
        {`${tipoEntrada.nombre} × ${cantidad} · ${formatearPrecio(tipoEntrada.precio)} c/u`}
      </Text>
      <Text variant="titleLarge" testID="compra-total">
        {`Total: ${formatearPrecio(total)}`}
      </Text>
      <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
        {`Comprada el ${formatearFecha(fechaCompra)}`}
      </Text>
    </View>
  );
}

function SeccionResenia({ resenia }) {
  const { usuario } = useAuth();
  if (!resenia) return null;
  const titulo = usuario?.rol === "ORGANIZADOR" ? "Reseña del comprador" : "Tu reseña";
  return (
    <View style={estilos.resenia} testID="compra-resenia">
      <Text variant="titleMedium">{titulo}</Text>
      <Estrellas valor={resenia.puntuacion} tamanio={20} />
      <Text variant="bodyMedium">{resenia.detalle}</Text>
    </View>
  );
}

const AVISOS_DE_RUTA = { resenia: "¡Gracias por tu reseña!" };

function useAviso(acciones) {
  const deRuta = useAvisoDeRuta(AVISOS_DE_RUTA);
  const cerrar = () => {
    acciones.cerrarAviso();
    deRuta.cerrar();
  };
  return { texto: acciones.aviso ?? deRuta.texto, cerrar };
}

function Contenido({ compra, carga }) {
  const acciones = useAccionesCompra({
    compra,
    reemplazar: carga.reemplazar,
    recargar: carga.recargar,
  });
  const aviso = useAviso(acciones);
  useRecargarAlVolver(carga.recargar);
  useSalaDeCompra(compra.id, {
    "compra:estado": ({ estado }) => {
      if (estado !== compra.estado) carga.recargar();
    },
  });
  return (
    <>
      <Pantalla scroll>
        <Estado compra={compra} />
        <Evento evento={compra.evento} />
        <Resumen compra={compra} />
        <AccionesCompra compra={compra} acciones={acciones} />
        <SeccionResenia resenia={compra.resenia} />
        <Divider />
        <Text variant="titleMedium">Historial</Text>
        <LineaDeTiempo historial={compra.historial} />
      </Pantalla>
      <Snackbar visible={!!aviso.texto} onDismiss={aviso.cerrar} testID="compra-aviso">
        {aviso.texto ?? ""}
      </Snackbar>
    </>
  );
}

export default function DetalleCompra() {
  return <ConCompra>{(compra, carga) => <Contenido compra={compra} carga={carga} />}</ConCompra>;
}

const estilos = StyleSheet.create({
  estado: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  evento: { paddingTop: espaciado.md, gap: espaciado.xs },
  resumen: { gap: espaciado.xs },
  resenia: { gap: espaciado.xs },
});
