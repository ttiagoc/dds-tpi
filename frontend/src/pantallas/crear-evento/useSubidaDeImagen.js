import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { mensajeDeError } from "../../api/cliente";
import { subirImagen } from "../../api/imagenes";

export const MENSAJE_SIN_PERMISO_FOTOS = "Necesitamos acceso a tus fotos para elegir la portada";

const OPCIONES_GALERIA = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [16, 9],
  quality: 0.8,
};

async function elegirDeLaGaleria() {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) throw new Error(MENSAJE_SIN_PERMISO_FOTOS);
  const resultado = await ImagePicker.launchImageLibraryAsync(OPCIONES_GALERIA);
  return resultado.canceled ? null : resultado.assets[0];
}

const textoDeError = (error) =>
  error.message === MENSAJE_SIN_PERMISO_FOTOS ? error.message : mensajeDeError(error);

const SIN_FOTO = { vistaPrevia: null, subiendo: false, error: null };

export function useSubidaDeImagen(onCambiar) {
  const [estado, setEstado] = useState(SIN_FOTO);

  const elegir = async () => {
    try {
      const asset = await elegirDeLaGaleria();
      if (!asset) return;
      setEstado({ vistaPrevia: asset.uri, subiendo: true, error: null });
      onCambiar(await subirImagen(asset));
      setEstado((actual) => ({ ...actual, subiendo: false }));
    } catch (error) {
      setEstado({ ...SIN_FOTO, error: textoDeError(error) });
    }
  };

  const quitar = () => {
    setEstado(SIN_FOTO);
    onCambiar("");
  };

  return { ...estado, elegir, quitar };
}
