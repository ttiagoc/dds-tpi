import { Pantalla } from "./Pantalla";
import { Cargando } from "./Cargando";
import { ErrorCarga } from "./ErrorCarga";
import { AvisoConVolver } from "./AvisoConVolver";

export function ConCarga({ carga, iconoInexistente, testIDInexistente, children }) {
  const { datos, cargando, error, codigoError, recargar } = carga;
  if (cargando && !datos) return <Cargando />;
  if (codigoError === 403 || codigoError === 404) {
    return <AvisoConVolver icono={iconoInexistente} texto={error} testID={testIDInexistente} />;
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
