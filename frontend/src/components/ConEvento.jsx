import { obtenerEvento } from "../api/eventosApi";
import { ConRecursoDeRuta } from "./ConRecursoDeRuta";

export function ConEvento({ children }) {
  return (
    <ConRecursoDeRuta
      obtener={obtenerEvento}
      iconoInexistente="calendar-remove"
      testIDInexistente="evento-inexistente"
    >
      {children}
    </ConRecursoDeRuta>
  );
}
