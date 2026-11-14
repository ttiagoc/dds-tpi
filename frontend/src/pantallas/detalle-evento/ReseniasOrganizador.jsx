import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Surface, Text, useTheme } from "react-native-paper";
import { obtenerReseniasDeOrganizador } from "../../api/organizadoresApi";
import { ErrorEnLinea } from "../../components/ErrorEnLinea";
import { Estrellas } from "../../components/Estrellas";
import { useCargar } from "../../hooks/useCargar";
import { espaciado, radios } from "../../tema/espaciado";
import { formatearDia, formatearPuntaje } from "../../utils/formato";

const CANTIDAD_A_MOSTRAR = 3;

function Resenia({ resenia }) {
  const { colors } = useTheme();
  const secundario = { color: colors.onSurfaceVariant };
  return (
    <Surface style={estilos.resenia} elevation={0} testID={`resenia-${resenia.id}`}>
      <Estrellas valor={resenia.puntuacion} />
      <Text variant="bodyMedium">{resenia.detalle}</Text>
      <Text variant="bodySmall" style={secundario}>
        {`${resenia.comprador.nombre} · ${resenia.evento.nombre} · ${formatearDia(resenia.fecha)}`}
      </Text>
    </Surface>
  );
}

function Resumen({ organizador }) {
  const { puntajePromedio, cantidadResenias } = organizador;
  if (!cantidadResenias) {
    return <Text variant="bodyMedium">Este organizador todavía no tiene reseñas</Text>;
  }
  const cantidad = cantidadResenias === 1 ? "1 reseña" : `${cantidadResenias} reseñas`;
  return (
    <View style={estilos.resumen}>
      <Estrellas valor={puntajePromedio} tamanio={20} />
      <Text variant="titleSmall">{`${formatearPuntaje(puntajePromedio)} · ${cantidad}`}</Text>
    </View>
  );
}

function Contenido({ datos, cargando, error, recargar }) {
  if (cargando) return <ActivityIndicator accessibilityLabel="Cargando reseñas" />;
  if (error) return <ErrorEnLinea mensaje={error} onReintentar={recargar} />;
  return (
    <>
      <Resumen organizador={datos.organizador} />
      {datos.resenias.map((resenia) => (
        <Resenia key={resenia.id} resenia={resenia} />
      ))}
    </>
  );
}

export function ReseniasOrganizador({ organizadorId }) {
  const cargar = useCallback(
    () => obtenerReseniasDeOrganizador(organizadorId, { limit: CANTIDAD_A_MOSTRAR }),
    [organizadorId],
  );
  const estado = useCargar(cargar);
  return (
    <View style={estilos.seccion} testID="resenias-organizador">
      <Text variant="titleMedium">Reseñas del organizador</Text>
      <Contenido {...estado} />
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espaciado.sm },
  resumen: { flexDirection: "row", alignItems: "center", gap: espaciado.sm },
  resenia: { gap: espaciado.xs, padding: espaciado.md, borderRadius: radios.md },
});
