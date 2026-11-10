import { describe, it, expect, jest } from "@jest/globals";
import { notFoundHandler } from "../../src/middlewares/notFoundHandler.js";
import { NotFoundError } from "../../src/errors/AppError.js";

describe("notFoundHandler", () => {
  it("pasa un NotFoundError con método y ruta", () => {
    const next = jest.fn();
    notFoundHandler({ method: "DELETE", path: "/nada" }, {}, next);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe("No existe la ruta DELETE /nada");
  });
});
