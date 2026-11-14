import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Chip, Snackbar, Text, useTheme } from "react-native-paper";
import { router } from "expo-router";
import { useAuth } from "../../auth/AuthContext";
import { Pantalla } from "../../components/Pantalla";
import { ConEvento } from "../../components/ConEvento";
import { FechaYLugar } from "../../components/FechaYLugar";
import { ImagenEvento } from "../../components/ImagenEvento";
import { PuntajeOrganizador } from "../../components/PuntajeOrganizador";
import { useRecargarAlVolver } from "../../hooks/useRecargarAlVolver";
import { espaciado } from "../../tema/espaciado";
import { BotonFavorito } from "./BotonFavorito";
import { ReseniasOrganizador } from "./ReseniasOrganizador";
import { TiposEntrada } from "./TiposEntrada";

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
      <FechaYLugar fecha={evento.fecha} lugar={evento.lugar} variant="bodyLarge" atenuado={false} />
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
  if (evento.finalizado) {
    return (
      <Button mode="contained" icon="flag-checkered" disabled testID="evento-finalizado">
        Evento finalizado
      </Button>
    );
  }
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

function Contenido({ evento, recargar }) {
  const { usuario } = useAuth();
  useRecargarAlVolver(recargar);
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
  return (
    <ConEvento>
      {(evento, carga) => <Contenido evento={evento} recargar={carga.recargar} />}
    </ConEvento>
  );
}

const estilos = StyleSheet.create({
  encabezado: { gap: espaciado.sm },
  titulo: { flexDirection: "row", alignItems: "center", gap: espaciado.sm },
  nombre: { flex: 1 },
  categoria: { alignSelf: "flex-start" },
});
