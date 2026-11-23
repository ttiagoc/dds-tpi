import { Aviso } from "../../components/Aviso";
import { Pantalla } from "../../components/Pantalla";

export default function EscanearEntrada() {
  return (
    <Pantalla>
      <Aviso
        icono="cellphone"
        texto="El escáner está disponible en el celular"
        testID="escaner-solo-celular"
      />
    </Pantalla>
  );
}
