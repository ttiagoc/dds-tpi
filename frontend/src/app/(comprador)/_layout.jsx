import { Pestanias } from "../../navegacion/Pestanias";

const PESTANIAS = [
  { ruta: "explorar", titulo: "Explorar", icono: "magnify", conLogo: true },
  { ruta: "mis-compras", titulo: "Mis compras", icono: "ticket-outline" },
  { ruta: "favoritos", titulo: "Favoritos", icono: "heart-outline" },
  { ruta: "perfil", titulo: "Perfil", icono: "account-circle-outline" },
];

export default function LayoutComprador() {
  return <Pestanias pestanias={PESTANIAS} />;
}
