import { describe, it, expect, jest } from "@jest/globals";
import { FavoritoController } from "../../src/controllers/FavoritoController.js";
import { llamarController, probarIdYErrores, usuarioComprador } from "../helpers/http.js";

describe("FavoritoController", () => {
  it("listar delega con el usuario y responde 200", async () => {
    const servicio = { listar: jest.fn().mockResolvedValue([{ id: 1 }]) };
    const { res } = await llamarController(FavoritoController, "listar", {}, servicio);
    expect(servicio.listar).toHaveBeenCalledWith(usuarioComprador);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

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
