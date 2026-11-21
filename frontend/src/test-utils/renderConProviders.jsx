import { render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "../auth/AuthContext";
import { temaClaro } from "../tema/tema";
import { PreferenciaTemaProvider } from "../tema/PreferenciaTemaContext";

export const ANA = {
  id: 3,
  nombre: "Ana",
  apellido: "Pérez",
  email: "ana@aiticket.com",
  rol: "COMPRADOR",
};

export const FENIX = {
  id: 2,
  nombre: "Fénix Producciones",
  apellido: null,
  email: "fenix@aiticket.com",
  rol: "ORGANIZADOR",
};

export function Providers({ children, usuario = null, token = "token-de-prueba" }) {
  const sesionInicial = usuario ? { token, usuario } : null;
  return (
    <PreferenciaTemaProvider>
      <PaperProvider theme={temaClaro}>
        <AuthProvider sesionInicial={sesionInicial}>{children}</AuthProvider>
      </PaperProvider>
    </PreferenciaTemaProvider>
  );
}

export function renderConProviders(ui, opciones = {}) {
  return render(<Providers {...opciones}>{ui}</Providers>);
}
