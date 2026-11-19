import { StyleSheet, View } from "react-native";
import { TarjetaPlana } from "../../components/TarjetaPlana";
import { Divider, Snackbar, Text, TouchableRipple, useTheme } from "react-native-paper";
import { router } from "expo-router";
import { useAuth } from "../../auth/AuthContext";
import { ChipEstado } from "../../components/ChipEstado";
import { ConCompra } from "../../components/ConCompra";
import { Estrellas } from "../../components/Estrellas";
import { FechaYLugar } from "../../components/FechaYLugar";
import { ImagenEvento } from "../../components/ImagenEvento";
import { LineaDeTiempo } from "../../components/LineaDeTiempo";
import { Pantalla } from "../../components/Pantalla";
import { Troquel } from "../../components/Troquel";
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
        <Text
          variant="labelLarge"
          style={{ color: colors.onSurfaceVariant }}
          testID="dias-restantes"
        >
          {dias}
        </Text>
      )}
    </View>
  );
}

function Evento({ evento }) {
  return (
    <TouchableRipple
      onPress={() => router.push(`/eventos/${evento.id}`)}
      testID="compra-evento"
      accessibilityRole="button"
      accessibilityLabel={`Ver el evento ${evento.nombre}`}
    >
      <View style={estilos.evento}>
        <ImagenEvento uri={evento.imagen} nombre={evento.nombre} />
        <View style={estilos.datos}>
          <Text variant="titleLarge">{evento.nombre}</Text>
          <FechaYLugar fecha={evento.fecha} lugar={evento.lugar} />
        </View>
      </View>
    </TouchableRipple>
  );
}

function Resumen({ compra }) {
  const { colors } = useTheme();
  const { tipoEntrada, cantidad, total, fechaCompra } = compra;
  return (
    <View style={[estilos.datos, estilos.resumen]}>
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

function Entrada({ compra }) {
  const { colors } = useTheme();
  return (
    <TarjetaPlana style={estilos.entrada}>
      <Evento evento={compra.evento} />
      <Resumen compra={compra} />
      <Troquel testID="compra-troquel" />
      <Estado compra={compra} />
    </TarjetaPlana>
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
        <Entrada compra={compra} />
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
  entrada: { borderWidth: 1, overflow: "hidden" },
  estado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: espaciado.lg,
  },
  evento: { gap: espaciado.md },
  datos: { gap: espaciado.xs, paddingHorizontal: espaciado.lg },
  resumen: { paddingTop: espaciado.sm, paddingBottom: espaciado.lg },
  resenia: { gap: espaciado.xs },
});
