import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { radios } from "../tema/espaciado";

export function ImagenEvento({ uri, nombre, redondeada = false }) {
  const { colors } = useTheme();
  const [fallo, setFallo] = useState(false);
  const forma = [estilos.imagen, redondeada && estilos.redondeada];
  if (!uri || fallo) {
    return (
      <View
        style={[...forma, estilos.centro, { backgroundColor: colors.surfaceVariant }]}
        testID="imagen-placeholder"
        accessible
        accessibilityLabel={`Imagen de ${nombre}`}
      >
        <Icon source="calendar-star" size={48} color={colors.onSurfaceVariant} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[...forma, { backgroundColor: colors.surfaceVariant }]}
      resizeMode="cover"
      onError={() => setFallo(true)}
      accessibilityLabel={`Imagen de ${nombre}`}
    />
  );
}

const estilos = StyleSheet.create({
  imagen: { width: "100%", aspectRatio: 16 / 9 },
  redondeada: { borderRadius: radios.md },
  centro: { alignItems: "center", justifyContent: "center" },
});
