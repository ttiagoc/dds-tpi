import { StyleSheet, View } from "react-native";
import { Icon, IconButton, useTheme } from "react-native-paper";
import { formatearPuntaje } from "../utils/formato";

const ICONOS = { llena: "star", media: "star-half-full", vacia: "star-outline" };
const POSICIONES = [1, 2, 3, 4, 5];

function tipoDeEstrella(posicion, redondeado) {
  if (redondeado >= posicion) return "llena";
  return redondeado >= posicion - 0.5 ? "media" : "vacia";
}

function Posiciones({ valor, children, ...props }) {
  return (
    <View style={estilos.fila} {...props}>
      {POSICIONES.map((posicion) => {
        const tipo = tipoDeEstrella(posicion, valor);
        return (
          <View key={posicion} testID={`estrella-${tipo}-${posicion}`}>
            {children(posicion, ICONOS[tipo])}
          </View>
        );
      })}
    </View>
  );
}

function EstrellasEditables({ valor, onElegir, deshabilitadas, tamanio }) {
  const { colors } = useTheme();
  return (
    <Posiciones valor={valor ?? 0}>
      {(posicion, icono) => (
        <IconButton
          icon={icono}
          size={tamanio}
          iconColor={colors.estrella}
          disabled={deshabilitadas}
          onPress={() => onElegir(posicion)}
          testID={`estrella-${posicion}`}
          accessibilityLabel={`Puntuar ${posicion} de 5`}
        />
      )}
    </Posiciones>
  );
}

export function Estrellas({ valor, tamanio = 16, onElegir, deshabilitadas = false }) {
  const { colors } = useTheme();
  if (onElegir) {
    return (
      <EstrellasEditables
        valor={valor}
        onElegir={onElegir}
        deshabilitadas={deshabilitadas}
        tamanio={tamanio}
      />
    );
  }
  if (valor == null) return null;
  return (
    <Posiciones
      valor={Math.round(valor * 2) / 2}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Puntaje ${formatearPuntaje(valor)} de 5`}
    >
      {(_, icono) => <Icon source={icono} size={tamanio} color={colors.estrella} />}
    </Posiciones>
  );
}

const estilos = StyleSheet.create({ fila: { flexDirection: "row" } });
