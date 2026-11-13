import { cliente } from "./cliente";

export const login = (credenciales) =>
  cliente.post("/auth/login", credenciales).then((respuesta) => respuesta.data);

export const obtenerYo = () => cliente.get("/auth/yo").then((respuesta) => respuesta.data);
