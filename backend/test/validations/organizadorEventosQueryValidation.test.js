import { describe, it, expect } from "@jest/globals";
import { organizadorEventosQueryValidation } from "../../src/validations/organizadorEventosQueryValidation.js";

const parsear = (query) => organizadorEventosQueryValidation.safeParse(query);

describe("organizadorEventosQueryValidation", () => {
  it("aplica page 1 y limit 20 por defecto", () => {
    expect(parsear({}).data).toEqual({ page: 1, limit: 20 });
  });

  it("convierte los números y ignora los vacíos", () => {
    expect(parsear({ page: "2", limit: "4" }).data).toEqual({ page: 2, limit: 4 });
    expect(parsear({ page: "", limit: " " }).data).toEqual({ page: 1, limit: 20 });
  });

  it.each([[{ limit: "51" }], [{ page: "0" }], [{ limit: "1.5" }], [{ q: "rock" }]])(
    "rechaza %p",
    (query) => {
      expect(parsear(query).success).toBe(false);
    },
  );
});
