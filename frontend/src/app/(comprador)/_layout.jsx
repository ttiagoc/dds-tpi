import { textoBadge, useNoLeidos } from "../../mensajes/NoLeidosContext";
import { Pestanias } from "../../navegacion/Pestanias";

const PESTANIAS = [
  { ruta: "explorar", titulo: "Explorar", icono: "magnify", conLogo: true },
  { ruta: "mis-compras", titulo: "Entradas", icono: "ticket-outline" },
  { ruta: "mensajes", titulo: "Mensajes", icono: "chat-outline", conBadge: true },
  { ruta: "favoritos", titulo: "Favoritos", icono: "heart-outline" },
  { ruta: "perfil", titulo: "Perfil", icono: "account-circle-outline" },
];

export default function LayoutComprador() {
  const { total } = useNoLeidos();
  return <Pestanias pestanias={PESTANIAS} badge={textoBadge(total)} />;
}
