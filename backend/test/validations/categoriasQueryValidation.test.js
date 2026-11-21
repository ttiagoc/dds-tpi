import { describe, it, expect } from "@jest/globals";
import { categoriasQueryValidation } from "../../src/validations/categoriasQueryValidation.js";

const parsear = (query) => categoriasQueryValidation.safeParse(query);

describe("categoriasQueryValidation", () => {
  it("sin parámetros usa página 1 y 20 por página", () => {
    expect(parsear({}).data).toEqual({ page: 1, limit: 20 });
  });

  it("recorta q y lo ignora si queda vacío", () => {
    expect(parsear({ q: "  conf " }).data.q).toBe("conf");
    expect(parsear({ q: "   " }).data.q).toBeUndefined();
  });

  it.each([[{ q: "a".repeat(51) }], [{ limit: "51" }], [{ page: "0" }], [{ orden: "desc" }]])(
    "rechaza %p",
    (query) => {
      expect(parsear(query).success).toBe(false);
    },
  );
});
