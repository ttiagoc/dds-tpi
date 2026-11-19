import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Snackbar, Text, useTheme } from "react-native-paper";
import { useAuth } from "../../auth/AuthContext";
import { Pantalla } from "../../components/Pantalla";
import { ConEvento } from "../../components/ConEvento";
import { FechaYLugar } from "../../components/FechaYLugar";
import { ImagenEvento } from "../../components/ImagenEvento";
import { PuntajeOrganizador } from "../../components/PuntajeOrganizador";
import { useRecargarAlVolver } from "../../hooks/useRecargarAlVolver";
import { espaciado, radios } from "../../tema/espaciado";
import { BarraComprar } from "./BarraComprar";
import { BotonFavorito } from "./BotonFavorito";
import { ReseniasOrganizador } from "./ReseniasOrganizador";
import { TiposEntrada } from "./TiposEntrada";

function Portada({ evento, esComprador, onErrorFavorito }) {
  return (
    <View style={estilos.portada}>
      <ImagenEvento uri={evento.imagen} nombre={evento.nombre} />
      {esComprador && (
        <View style={estilos.favorito}>
          <BotonFavorito
            eventoId={evento.id}
            inicial={evento.esFavorito}
            onError={onErrorFavorito}
          />
        </View>
      )}
    </View>
  );
}

function Categoria({ nombre }) {
  const { colors } = useTheme();
  return (
    <Text
      variant="labelSmall"
      style={[
        estilos.categoria,
        { backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer },
      ]}
    >
      {nombre.toLocaleUpperCase("es-AR")}
    </Text>
  );
}

function Encabezado({ evento }) {
  const { colors } = useTheme();
  return (
    <View style={estilos.encabezado}>
      <Categoria nombre={evento.categoria.nombre} />
      <Text variant="headlineMedium">{evento.nombre}</Text>
      <FechaYLugar fecha={evento.fecha} lugar={evento.lugar} variant="bodyLarge" />
      <View style={[estilos.organizador, { borderColor: colors.outlineVariant }]}>
        <PuntajeOrganizador organizador={evento.organizador} />
      </View>
      <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
        {evento.descripcion}
      </Text>
    </View>
  );
}

function Contenido({ evento, recargar }) {
  const { usuario } = useAuth();
  useRecargarAlVolver(recargar);
  const esComprador = usuario?.rol === "COMPRADOR";
  const [aviso, setAviso] = useState(null);
  return (
    <>
      <Pantalla scroll>
        <Portada evento={evento} esComprador={esComprador} onErrorFavorito={setAviso} />
        <Encabezado evento={evento} />
        <TiposEntrada tipos={evento.tiposEntrada} />
        <ReseniasOrganizador organizadorId={evento.organizador.id} />
      </Pantalla>
      {esComprador && <BarraComprar evento={evento} />}
      <Snackbar visible={!!aviso} onDismiss={() => setAviso(null)} testID="aviso-favorito">
        {aviso ?? ""}
      </Snackbar>
    </>
  );
}

export default function DetalleEvento() {
  return (
    <ConEvento>
      {(evento, carga) => <Contenido evento={evento} recargar={carga.recargar} />}
    </ConEvento>
  );
}

const estilos = StyleSheet.create({
  portada: { marginHorizontal: -espaciado.lg, marginTop: -espaciado.lg },
  favorito: { position: "absolute", top: espaciado.md, right: espaciado.md },
  encabezado: { gap: espaciado.sm },
  categoria: {
    alignSelf: "flex-start",
    paddingHorizontal: espaciado.sm + 2,
    paddingVertical: espaciado.xs,
    borderRadius: radios.pill,
    overflow: "hidden",
  },
  organizador: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: espaciado.md },
});
