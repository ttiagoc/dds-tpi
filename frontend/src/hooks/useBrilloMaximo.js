import * as Brightness from "expo-brightness";
import { useEffect } from "react";
import { AppState } from "react-native";

const MAXIMO = 1;
const ignorar = () => {};

export function useBrilloMaximo(activo) {
  useEffect(() => {
    if (!activo) return undefined;
    let vigente = true;
    let anterior = null;
    const subir = async () => {
      if (!(await Brightness.isAvailableAsync()) || !vigente) return;
      anterior ??= await Brightness.getBrightnessAsync();
      if (vigente) await Brightness.setBrightnessAsync(MAXIMO);
    };
    const restaurar = () => {
      if (anterior !== null) Brightness.setBrightnessAsync(anterior).catch(ignorar);
    };
    subir().catch(ignorar);
    const suscripcion = AppState.addEventListener("change", (estado) => {
      if (estado === "active") subir().catch(ignorar);
      else restaurar();
    });
    return () => {
      vigente = false;
      suscripcion.remove();
      restaurar();
    };
  }, [activo]);
}
