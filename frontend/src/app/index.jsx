import { Redirect } from "expo-router";
import { useAuth } from "../auth/AuthContext";
import { Cargando } from "../components/Cargando";

const INICIO_POR_ROL = { COMPRADOR: "/explorar", ORGANIZADOR: "/mis-eventos" };

export default function Inicio() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  return <Redirect href={usuario ? INICIO_POR_ROL[usuario.rol] : "/login"} />;
}
