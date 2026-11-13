import { io } from "socket.io-client";
import { obtenerToken } from "./cliente";

export const conectarSocket = () =>
  io(process.env.EXPO_PUBLIC_API_URL, {
    auth: { token: obtenerToken() },
    transports: ["websocket"],
  });
