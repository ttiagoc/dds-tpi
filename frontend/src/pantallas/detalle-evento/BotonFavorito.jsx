import { useRef, useState } from "react";
import { IconButton, useTheme } from "react-native-paper";
import { agregarFavorito, quitarFavorito } from "../../api/favoritosApi";
import { mensajeDeError } from "../../api/cliente";

export function BotonFavorito({ eventoId, inicial, onError }) {
  const { colors } = useTheme();
  const [favorito, setFavorito] = useState(inicial);
  const enviando = useRef(false);

  const alternar = async () => {
    if (enviando.current) return;
    enviando.current = true;
    const anterior = favorito;
    setFavorito(!anterior);
    try {
      await (anterior ? quitarFavorito : agregarFavorito)(eventoId);
    } catch (error) {
      setFavorito(anterior);
      onError(mensajeDeError(error));
    } finally {
      enviando.current = false;
    }
  };

  return (
    <IconButton
      icon={favorito ? "heart" : "heart-outline"}
      iconColor={colors.primary}
      mode="contained"
      containerColor={colors.surface}
      size={24}
      onPress={() => {
        alternar();
      }}
      testID="evento-favorito"
      accessibilityLabel={favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
    />
  );
}
