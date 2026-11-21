import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { radios } from "../../tema/espaciado";

const ZOOM = 0.004;

export function MapaUbicacion({ ubicacion }) {
  const punto = { latitude: ubicacion.latitud, longitude: ubicacion.longitud };
  return (
    <MapView
      style={estilos.mapa}
      region={{ ...punto, latitudeDelta: ZOOM, longitudeDelta: ZOOM }}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      accessibilityLabel={`Mapa con la ubicación de ${ubicacion.direccion}`}
      testID="ubicacion-mapa"
    >
      <Marker coordinate={punto} />
    </MapView>
  );
}

const estilos = StyleSheet.create({ mapa: { height: 180, borderRadius: radios.md } });
