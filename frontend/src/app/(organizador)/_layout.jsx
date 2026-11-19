import { textoBadge, useNoLeidos } from "../../mensajes/NoLeidosContext";
import { Pestanias } from "../../navegacion/Pestanias";

const PESTANIAS = [
  { ruta: "mis-eventos", titulo: "Mis eventos", icono: "calendar-star", conLogo: true },
  {
    ruta: "bandeja",
    titulo: "Mensajes",
    icono: "chat-outline",
    conBadge: true,
    testID: "tab-mensajes",
  },
  { ruta: "cuenta", titulo: "Perfil", icono: "account-circle-outline", testID: "tab-perfil" },
];

export default function LayoutOrganizador() {
  const { total } = useNoLeidos();
  return <Pestanias pestanias={PESTANIAS} badge={textoBadge(total)} />;
}
