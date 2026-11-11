import { StyleSheet, View } from "react-native";
import { Icon, Text, useTheme } from "react-native-paper";
import { espaciado } from "../tema/espaciado";
import { useEstadoCompra } from "../tema/useEstadoCompra";
import { formatearFecha } from "../utils/formato";

function Paso({ cambio, indice, ultimo }) {
  const { colors } = useTheme();
  const { etiqueta, icono, fondo, texto } = useEstadoCompra(cambio.estado);
  return (
    <View style={estilos.paso} testID={`historial-${indice}`}>
      <View style={estilos.marcador}>
        <View style={[estilos.icono, { backgroundColor: fondo }]}>
          <Icon source={icono} size={18} color={texto} />
        </View>
        {!ultimo && <View style={[estilos.linea, { backgroundColor: colors.outlineVariant }]} />}
      </View>
      <View style={estilos.datos}>
        <Text variant="titleSmall">{etiqueta}</Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
          {`${cambio.quien.nombre} · ${formatearFecha(cambio.fechaHora)}`}
        </Text>
      </View>
    </View>
  );
}

export function LineaDeTiempo({ historial }) {
  return (
    <View testID="linea-de-tiempo">
      {historial.map((cambio, i) => (
        <Paso
          key={`${cambio.estado}-${cambio.fechaHora}`}
          cambio={cambio}
          indice={i}
          ultimo={i === historial.length - 1}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  paso: { flexDirection: "row", gap: espaciado.md },
  marcador: { alignItems: "center" },
  icono: {
    width: espaciado.xxl,
    height: espaciado.xxl,
    borderRadius: espaciado.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  linea: { width: espaciado.xs / 2, flex: 1, minHeight: espaciado.md },
  datos: { flex: 1, paddingBottom: espaciado.md, gap: espaciado.xs },
});
