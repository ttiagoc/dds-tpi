import { Pantalla } from "./Pantalla";
import { Cargando } from "./Cargando";
import { ErrorCarga } from "./ErrorCarga";
import { EstadoVacio } from "./EstadoVacio";
import { volver } from "../navegacion/volver";

export function ConCarga({ carga, iconoInexistente, testIDInexistente, children }) {
  const { datos, cargando, error, codigoError, recargar } = carga;
  if (cargando && !datos) return <Cargando />;
  if (codigoError === 404) {
    return (
      <Pantalla>
        <EstadoVacio
          icono={iconoInexistente}
          texto={error}
          accion={{ etiqueta: "Volver", onPress: volver, testID: "volver" }}
          testID={testIDInexistente}
        />
      </Pantalla>
    );
  }
  if (error) {
    return (
      <Pantalla>
        <ErrorCarga mensaje={error} onReintentar={recargar} />
      </Pantalla>
    );
  }
  return children(datos);
}
