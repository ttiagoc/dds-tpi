import { describe, it, expect, jest } from "@jest/globals";
import { FavoritoController } from "../../src/controllers/FavoritoController.js";
import {
  llamarController,
  probarIdYErrores,
  probarQueryInvalida,
  responderCon,
  usuarioComprador,
} from "../helpers/http.js";

describe("FavoritoController", () => {
  it("listar valida la paginación, delega con el usuario y responde 200", async () => {
    const pagina = { eventos: [{ id: 1 }], total: 1, page: 2, totalPages: 1 };
    const req = { query: { page: "2" } };
    const listar = await responderCon(FavoritoController, "listar", req, pagina);
    expect(listar).toHaveBeenCalledWith(usuarioComprador, { page: 2, limit: 20 });
  });

  probarQueryInvalida(FavoritoController, "listar", { query: { limit: "0" } });

  it.each(["agregar", "quitar"])(
    "%s parsea el eventoId, delega y responde 204 sin cuerpo",
    async (metodo) => {
      const servicio = { [metodo]: jest.fn().mockResolvedValue(undefined) };
      const req = { params: { eventoId: "4" } };
      const { res } = await llamarController(FavoritoController, metodo, req, servicio);
      expect(servicio[metodo]).toHaveBeenCalledWith(4, usuarioComprador);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalledWith();
    },
  );
});

probarIdYErrores(FavoritoController, [
  ["agregar", "eventoId"],
  ["quitar", "eventoId"],
]);
