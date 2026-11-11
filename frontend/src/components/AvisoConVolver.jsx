import { EstadoVacio } from "./EstadoVacio";
import { Pantalla } from "./Pantalla";
import { volver } from "../navegacion/volver";

export function AvisoConVolver({ icono, texto, testID }) {
  return (
    <Pantalla>
      <EstadoVacio
        icono={icono}
        texto={texto}
        accion={{ etiqueta: "Volver", onPress: volver, testID: "volver" }}
        testID={testID}
      />
    </Pantalla>
  );
}
