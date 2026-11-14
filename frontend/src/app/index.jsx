import { Redirect } from "expo-router";
import { useAuth } from "../auth/AuthContext";

const INICIO_POR_ROL = { COMPRADOR: "/explorar", ORGANIZADOR: "/mis-eventos" };

export default function Inicio() {
  const { usuario } = useAuth();
  return <Redirect href={usuario ? INICIO_POR_ROL[usuario.rol] : "/login"} />;
}
