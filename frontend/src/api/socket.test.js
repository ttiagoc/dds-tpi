import { io } from "socket.io-client";
import { establecerToken } from "./cliente";
import { conectarSocket } from "./socket";

describe("conectarSocket", () => {
  it("se conecta a la API con el token de la sesión y solo por websocket", () => {
    establecerToken("abc");
    const socket = conectarSocket();
    expect(io).toHaveBeenCalledWith(process.env.EXPO_PUBLIC_API_URL, {
      auth: { token: "abc" },
      transports: ["websocket"],
    });
    expect(socket).toBe(io.mock.results.at(-1).value);
  });
});
