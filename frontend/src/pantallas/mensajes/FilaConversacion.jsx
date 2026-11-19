import { Image, StyleSheet, View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import { urlDeImagen } from "../../api/imagenes";
import { espaciado, radios } from "../../tema/espaciado";
import { formatearMomento } from "../../utils/formato";

const iniciales = (nombre) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toLocaleUpperCase("es-AR"))
    .join("");

function Miniatura({ conversacion, destacada }) {
  const { colors } = useTheme();
  const { evento, contraparte } = conversacion;
  const fondoIniciales = destacada ? colors.onSurface : colors.outlineVariant;
  const textoIniciales = destacada ? colors.surface : colors.onSurface;
  return (
    <View style={estilos.miniatura}>
      {evento.imagen ? (
        <Image
          source={{ uri: urlDeImagen(evento.imagen) }}
          style={[estilos.foto, { backgroundColor: colors.surfaceVariant }]}
        />
      ) : (
        <View style={[estilos.foto, { backgroundColor: colors.surfaceVariant }]} />
      )}
      <View
        style={[
          estilos.iniciales,
          { backgroundColor: fondoIniciales, borderColor: colors.surface },
        ]}
      >
        <Text variant="labelSmall" style={{ color: textoIniciales }}>
          {iniciales(contraparte.nombre)}
        </Text>
      </View>
    </View>
  );
}

function BadgeNoLeidos({ cantidad, testID }) {
  const { colors } = useTheme();
  return (
    <View style={[estilos.contador, { backgroundColor: colors.primary }]} testID={testID}>
      <Text variant="labelMedium" style={{ color: colors.onPrimary }}>
        {cantidad > 99 ? "99+" : cantidad}
      </Text>
    </View>
  );
}

const vistaPreviaDe = ({ ultimoMensaje }, usuarioId) =>
  `${ultimoMensaje.usuario.id === usuarioId ? "Vos: " : ""}${ultimoMensaje.mensaje}`;

const etiquetaDe = ({ contraparte, evento, noLeidos }, vistaPrevia) =>
  [contraparte.nombre, evento.nombre, noLeidos > 0 ? `${noLeidos} sin leer` : null, vistaPrevia]
    .filter(Boolean)
    .join(", ");

function Textos({ conversacion, vistaPrevia }) {
  const { colors } = useTheme();
  const { compraId, evento, contraparte, ultimoMensaje, noLeidos } = conversacion;
  const sinLeer = noLeidos > 0;
  const apagado = { color: colors.onSurfaceVariant };
  return (
    <View style={estilos.texto}>
      <View style={estilos.linea}>
        <Text variant="titleSmall" style={estilos.estirar} numberOfLines={1}>
          {contraparte.nombre}
        </Text>
        <Text variant="labelSmall" style={sinLeer ? { color: colors.primary } : apagado}>
          {formatearMomento(ultimoMensaje.enviado)}
        </Text>
      </View>
      <Text variant="bodySmall" style={apagado} numberOfLines={1}>
        {`${evento.nombre} · #${compraId}`}
      </Text>
      <View style={estilos.linea}>
        <Text
          variant={sinLeer ? "labelLarge" : "bodyMedium"}
          style={[estilos.estirar, !sinLeer && apagado]}
          numberOfLines={1}
        >
          {vistaPrevia}
        </Text>
        {sinLeer && <BadgeNoLeidos cantidad={noLeidos} testID={`no-leidos-${compraId}`} />}
      </View>
    </View>
  );
}

export function FilaConversacion({ conversacion, usuarioId, onPress }) {
  const { colors } = useTheme();
  const sinLeer = conversacion.noLeidos > 0;
  const vistaPrevia = vistaPreviaDe(conversacion, usuarioId);
  return (
    <TouchableRipple
      onPress={onPress}
      style={[
        estilos.fila,
        {
          borderColor: colors.outlineVariant,
          backgroundColor: sinLeer ? colors.surface : colors.background,
        },
      ]}
      testID={`conversacion-${conversacion.compraId}`}
      accessibilityRole="button"
      accessibilityLabel={etiquetaDe(conversacion, vistaPrevia)}
    >
      <View style={estilos.contenido}>
        <Miniatura conversacion={conversacion} destacada={sinLeer} />
        <Textos conversacion={conversacion} vistaPrevia={vistaPrevia} />
      </View>
    </TouchableRipple>
  );
}

const estilos = StyleSheet.create({
  fila: { borderTopWidth: 1, paddingVertical: espaciado.md + 2, paddingHorizontal: espaciado.lg },
  contenido: { flexDirection: "row", gap: espaciado.md, alignItems: "center" },
  miniatura: { width: 52, height: 52 },
  foto: { width: 52, height: 52, borderRadius: radios.md + 2 },
  iniciales: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 26,
    height: 26,
    borderRadius: radios.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  texto: { flex: 1, gap: 2 },
  linea: { flexDirection: "row", alignItems: "center", gap: espaciado.sm },
  estirar: { flex: 1 },
  contador: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radios.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
