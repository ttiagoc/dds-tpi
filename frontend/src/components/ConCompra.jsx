import { obtenerCompra } from "../api/comprasApi";
import { ConRecursoDeRuta } from "./ConRecursoDeRuta";

export function ConCompra({ children }) {
  return (
    <ConRecursoDeRuta
      obtener={obtenerCompra}
      iconoInexistente="ticket-outline"
      testIDInexistente="compra-inexistente"
    >
      {children}
    </ConRecursoDeRuta>
  );
}
