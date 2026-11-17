import { Pestanias } from "../../navegacion/Pestanias";

const PESTANIAS = [
  { ruta: "mis-eventos", titulo: "Mis eventos", icono: "calendar-star", conLogo: true },
  { ruta: "cuenta", titulo: "Perfil", icono: "account-circle-outline", testID: "tab-perfil" },
];

export default function LayoutOrganizador() {
  return <Pestanias pestanias={PESTANIAS} />;
}
