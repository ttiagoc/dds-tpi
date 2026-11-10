import { describe, it, expect } from "@jest/globals";
import { crearCompraValidation } from "../../src/validations/crearCompraValidation.js";
import { comprasQueryValidation } from "../../src/validations/comprasQueryValidation.js";

const camposConError = (resultado) => resultado.error.issues.map((issue) => issue.path.join("."));

describe("crearCompraValidation", () => {
  const body = (overrides = {}) => ({ eventoId: 1, tipoEntradaId: 2, cantidad: 3, ...overrides });
  const parsear = (datos) => crearCompraValidation.safeParse(datos);

  it("acepta un body válido", () => {
    expect(parsear(body())).toEqual({ success: true, data: body() });
  });

  it("acepta de 1 a 10 entradas", () => {
    expect(parsear(body({ cantidad: 1 })).success).toBe(true);
    expect(parsear(body({ cantidad: 10 })).success).toBe(true);
  });

  it.each([[0], [11], [1.5], ["2"]])("rechaza la cantidad %p", (cantidad) => {
    expect(camposConError(parsear(body({ cantidad })))).toEqual(["cantidad"]);
  });

  it("exige ids enteros positivos", () => {
    const resultado = parsear(body({ eventoId: 0, tipoEntradaId: -1 }));
    expect(camposConError(resultado)).toEqual(["eventoId", "tipoEntradaId"]);
  });

  it("rechaza campos de más y campos faltantes", () => {
    expect(camposConError(parsear(body({ total: 10 })))).toEqual([""]);
    expect(camposConError(parsear({ eventoId: 1 }))).toEqual(["tipoEntradaId", "cantidad"]);
  });
});

describe("comprasQueryValidation", () => {
  const parsear = (query) => comprasQueryValidation.safeParse(query);

  it("aplica los valores por defecto sin estado", () => {
    expect(parsear({}).data).toEqual({ page: 1, limit: 20 });
  });

  it("acepta un estado válido y convierte la paginación", () => {
    expect(parsear({ estado: "CONFIRMADA", page: "2", limit: "5" }).data).toEqual({
      estado: "CONFIRMADA",
      page: 2,
      limit: 5,
    });
  });

  it("ignora los vacíos", () => {
    expect(parsear({ estado: "", page: "", limit: "" }).data).toEqual({ page: 1, limit: 20 });
  });

  it.each([[{ estado: "PAGADA" }], [{ estado: "confirmada" }], [{ limit: "51" }], [{ q: "x" }]])(
    "rechaza %p",
    (query) => {
      expect(parsear(query).success).toBe(false);
    },
  );
});
