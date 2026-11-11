import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Chip, Snackbar, Text, useTheme } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { obtenerEvento } from "../../api/eventosApi";
import { useAuth } from "../../auth/AuthContext";
import { Pantalla } from "../../components/Pantalla";
import { Cargando } from "../../components/Cargando";
import { ErrorCarga } from "../../components/ErrorCarga";
import { EstadoVacio } from "../../components/EstadoVacio";
import { ImagenEvento } from "../../components/ImagenEvento";
import { PuntajeOrganizador } from "../../components/PuntajeOrganizador";
import { useCargar } from "../../hooks/useCargar";
import { espaciado } from "../../tema/espaciado";
import { formatearFecha } from "../../utils/formato";
import { BotonFavorito } from "./BotonFavorito";
import { ReseniasOrganizador } from "./ReseniasOrganizador";
import { TiposEntrada } from "./TiposEntrada";

const volver = () => (router.canGoBack() ? router.back() : router.replace("/"));

function Encabezado({ evento, esComprador, onErrorFavorito }) {
  const { colors } = useTheme();
  return (
    <View style={estilos.encabezado}>
      <ImagenEvento uri={evento.imagen} nombre={evento.nombre} redondeada />
      <View style={estilos.titulo}>
        <Text variant="headlineSmall" style={estilos.nombre}>
          {evento.nombre}
        </Text>
        {esComprador && (
          <BotonFavorito
            eventoId={evento.id}
            inicial={evento.esFavorito}
            onError={onErrorFavorito}
          />
        )}
      </View>
      <Text variant="bodyLarge">{`${formatearFecha(evento.fecha)} · ${evento.lugar}`}</Text>
      <Chip compact icon="tag-outline" style={estilos.categoria}>
        {evento.categoria.nombre}
      </Chip>
      <PuntajeOrganizador organizador={evento.organizador} />
      <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
        {evento.descripcion}
      </Text>
    </View>
  );
}

function BotonComprar({ evento }) {
  const agotado = evento.tiposEntrada.every((tipo) => tipo.disponibles === 0);
  return (
    <Button
      mode="contained"
      icon={agotado ? undefined : "ticket-outline"}
      disabled={agotado}
      onPress={() => router.push(`/eventos/${evento.id}/comprar`)}
      testID="evento-comprar"
    >
      {agotado ? "Agotado" : "Comprar"}
    </Button>
  );
}

function Contenido({ evento }) {
  const { usuario } = useAuth();
  const esComprador = usuario?.rol === "COMPRADOR";
  const [aviso, setAviso] = useState(null);
  return (
    <>
      <Pantalla scroll>
        <Encabezado evento={evento} esComprador={esComprador} onErrorFavorito={setAviso} />
        <TiposEntrada tipos={evento.tiposEntrada} />
        {esComprador && <BotonComprar evento={evento} />}
        <ReseniasOrganizador organizadorId={evento.organizador.id} />
      </Pantalla>
      <Snackbar visible={!!aviso} onDismiss={() => setAviso(null)} testID="aviso-favorito">
        {aviso ?? ""}
      </Snackbar>
    </>
  );
}

export default function DetalleEvento() {
  const { id } = useLocalSearchParams();
  const cargar = useCallback(() => obtenerEvento(id), [id]);
  const { datos, cargando, error, codigoError, recargar } = useCargar(cargar);
  if (cargando) return <Cargando />;
  if (codigoError === 404) {
    return (
      <Pantalla>
        <EstadoVacio
          icono="calendar-remove"
          texto={error}
          accion={{ etiqueta: "Volver", onPress: volver, testID: "volver" }}
          testID="evento-inexistente"
        />
      </Pantalla>
    );
  }
  if (error) {
    return (
      <Pantalla>
        <ErrorCarga mensaje={error} onReintentar={recargar} />
      </Pantalla>
    );
  }
  return <Contenido evento={datos} />;
}

const estilos = StyleSheet.create({
  encabezado: { gap: espaciado.sm },
  titulo: { flexDirection: "row", alignItems: "center", gap: espaciado.sm },
  nombre: { flex: 1 },
  categoria: { alignSelf: "flex-start" },
});
