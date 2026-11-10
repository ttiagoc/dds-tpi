import { Pantalla } from "../../components/Pantalla";
import { EstadoVacio } from "../../components/EstadoVacio";

export default function Proximamente() {
  return (
    <Pantalla>
      <EstadoVacio icono="progress-wrench" texto="Próximamente" testID="proximamente" />
    </Pantalla>
  );
}
