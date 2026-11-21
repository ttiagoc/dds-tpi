import { useRef } from "react";
import { AccessibilityInfo, findNodeHandle } from "react-native";

const MARGEN_SUPERIOR = 24;

function darFocoDeAccesibilidad(nodo) {
  const handle = nodo && findNodeHandle(nodo);
  if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
}

export function useFoco() {
  const scroll = useRef(null);
  const campos = useRef(new Map());

  const guardar = (clave, cambios) =>
    campos.current.set(clave, { ...campos.current.get(clave), ...cambios });

  const registrar = (clave) => ({
    ref: (nodo) => guardar(clave, { nodo }),
    onLayout: (evento) => guardar(clave, { y: evento.nativeEvent.layout.y }),
  });

  const registrarEntrada = (clave) => (entrada) => guardar(clave, { entrada });

  const enfocar = (clave) => {
    const { nodo, y, entrada } = campos.current.get(clave) ?? {};
    if (y != null)
      scroll.current?.scrollTo({ y: Math.max(0, y - MARGEN_SUPERIOR), animated: true });
    if (entrada?.focus) entrada.focus();
    else darFocoDeAccesibilidad(nodo);
  };

  const anunciar = (texto) => AccessibilityInfo.announceForAccessibility(texto);

  return { scroll, registrar, registrarEntrada, enfocar, anunciar };
}
