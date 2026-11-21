import { Linking } from "react-native";
import { Button } from "react-native-paper";
import { urlComoLlegar } from "../../utils/mapas";

export function MapaUbicacion({ ubicacion }) {
  return (
    <Button
      mode="text"
      icon="map-search-outline"
      onPress={() => Linking.openURL(urlComoLlegar({ ubicacion }))}
      testID="ubicacion-mapa"
    >
      Ver en Google Maps
    </Button>
  );
}
