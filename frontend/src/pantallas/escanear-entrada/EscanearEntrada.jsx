import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import { Linking, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Aviso } from "../../components/Aviso";
import { Cargando } from "../../components/Cargando";
import { Pantalla } from "../../components/Pantalla";
import { radios } from "../../tema/espaciado";
import { ResultadoEscaneo } from "./ResultadoEscaneo";
import { useEscaneo } from "./useEscaneo";

const SOLO_QR = { barcodeTypes: ["qr"] };

function SinPermiso({ permiso, pedir }) {
  const accion = permiso.canAskAgain
    ? { etiqueta: "Dar permiso", onPress: pedir, testID: "escaner-dar-permiso" }
    : {
        etiqueta: "Abrir ajustes",
        onPress: () => Linking.openSettings(),
        testID: "escaner-ajustes",
      };
  return (
    <Aviso
      icono="camera-off-outline"
      texto="Necesitamos la cámara para escanear entradas"
      accion={accion}
      testID="escaner-sin-permiso"
    />
  );
}

function Escaner({ escaneo }) {
  const { colors } = useTheme();
  return (
    <>
      <View style={[estilos.camara, { backgroundColor: colors.inverseSurface }]}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={SOLO_QR}
          onBarcodeScanned={escaneo.escaneando ? escaneo.leer : undefined}
          testID="escaner-camara"
        />
      </View>
      {escaneo.escaneando ? (
        <Text variant="bodyLarge" style={[estilos.indicacion, { color: colors.onSurfaceVariant }]}>
          Apuntá al QR de la entrada
        </Text>
      ) : (
        <ResultadoEscaneo escaneo={escaneo} />
      )}
    </>
  );
}

export default function EscanearEntrada() {
  const { id } = useLocalSearchParams();
  const [permiso, pedir] = useCameraPermissions();
  const escaneo = useEscaneo(id);
  if (!permiso) return <Cargando />;
  return (
    <Pantalla scroll>
      {permiso.granted ? (
        <Escaner escaneo={escaneo} />
      ) : (
        <SinPermiso permiso={permiso} pedir={pedir} />
      )}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  camara: { width: "100%", aspectRatio: 1, borderRadius: radios.lg, overflow: "hidden" },
  indicacion: { textAlign: "center" },
});
