import { StyleSheet, View } from "react-native";
import { ProgressBar, Text } from "react-native-paper";
import { espaciado } from "../tema/espaciado";

export function BarraDeVentas({ vendidas, cupo }) {
  return (
    <View style={estilos.barra}>
      <View style={estilos.pista} testID="barra-ventas-pista">
        <ProgressBar
          progress={cupo > 0 ? vendidas / cupo : 0}
          accessibilityLabel={`${vendidas} de ${cupo} vendidas`}
        />
      </View>
      <Text variant="bodySmall">{`${vendidas} de ${cupo} vendidas`}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: { gap: espaciado.xs },
  pista: { height: espaciado.xs },
});
