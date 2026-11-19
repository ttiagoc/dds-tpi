import { Image, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  HelperText,
  Icon,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { urlDeImagen } from "../../api/imagenes";
import { espaciado, radios } from "../../tema/espaciado";

function SinFoto({ onElegir, deshabilitado }) {
  const { colors } = useTheme();
  return (
    <TouchableRipple
      onPress={onElegir}
      disabled={deshabilitado}
      style={[estilos.recuadro, { borderColor: colors.outline, backgroundColor: colors.surface }]}
      accessibilityRole="button"
      accessibilityLabel="Agregar foto de portada"
      testID="evento-imagen"
    >
      <View style={estilos.centro}>
        <View style={[estilos.icono, { backgroundColor: colors.primaryContainer }]}>
          <Icon source="image-plus" size={24} color={colors.primary} />
        </View>
        <Text variant="titleSmall">Agregar foto de portada</Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
          Desde la galería · JPG, PNG o WEBP hasta 5 MB
        </Text>
      </View>
    </TouchableRipple>
  );
}

function Acciones({ subida, bloqueado }) {
  return (
    <View style={estilos.acciones}>
      <Button
        mode="outlined"
        onPress={() => {
          subida.elegir();
        }}
        disabled={bloqueado}
        testID="evento-imagen-cambiar"
      >
        Cambiar
      </Button>
      <Button
        mode="text"
        onPress={subida.quitar}
        disabled={bloqueado}
        testID="evento-imagen-quitar"
      >
        Quitar
      </Button>
    </View>
  );
}

function ConFoto({ uri, subida, deshabilitado }) {
  const { colors } = useTheme();
  return (
    <View style={estilos.conFoto}>
      <View>
        <Image
          source={{ uri }}
          style={[estilos.foto, { backgroundColor: colors.surfaceVariant }]}
          accessibilityLabel="Foto de portada"
          testID="evento-imagen-vista"
        />
        {subida.subiendo && (
          <View style={[estilos.velo, { backgroundColor: colors.backdrop }]}>
            <ActivityIndicator color={colors.surface} testID="evento-imagen-subiendo" />
          </View>
        )}
      </View>
      <Acciones subida={subida} bloqueado={subida.subiendo || deshabilitado} />
    </View>
  );
}

export function SelectorImagen({ url, subida, deshabilitado }) {
  const uri = subida.vistaPrevia ?? (url ? urlDeImagen(url) : null);
  return (
    <View style={estilos.selector}>
      {uri ? (
        <ConFoto uri={uri} subida={subida} deshabilitado={deshabilitado} />
      ) : (
        <SinFoto
          onElegir={() => {
            subida.elegir();
          }}
          deshabilitado={deshabilitado}
        />
      )}
      {subida.error && (
        <HelperText type="error" visible testID="evento-imagen-error">
          {subida.error}
        </HelperText>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  selector: { gap: espaciado.xs },
  recuadro: {
    height: 168,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: radios.lg,
    justifyContent: "center",
  },
  centro: { alignItems: "center", gap: espaciado.sm },
  icono: {
    width: 48,
    height: 48,
    borderRadius: radios.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  conFoto: { gap: espaciado.sm },
  foto: { width: "100%", aspectRatio: 16 / 9, borderRadius: radios.lg },
  velo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radios.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  acciones: { flexDirection: "row", gap: espaciado.sm },
});
