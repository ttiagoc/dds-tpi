import { Aviso } from "./Aviso";

export function EstadoVacio({ icono, texto, accion, testID = "estado-vacio" }) {
  return <Aviso icono={icono} texto={texto} accion={accion} testID={testID} />;
}
