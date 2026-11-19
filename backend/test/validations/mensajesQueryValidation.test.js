import { describe, it, expect } from "@jest/globals";
import { mensajesQueryValidation } from "../../src/validations/mensajesQueryValidation.js";

const parsear = (query) => mensajesQueryValidation.safeParse(query);

describe("mensajesQueryValidation", () => {
  it("sin cursor trae los 30 más recientes", () => {
    expect(parsear({}).data).toEqual({ limit: 30 });
  });

  it("convierte el cursor y el límite e ignora los vacíos", () => {
    expect(parsear({ antesDe: "12", limit: "5" }).data).toEqual({ antesDe: 12, limit: 5 });
    expect(parsear({ antesDe: "", limit: " " }).data).toEqual({ limit: 30 });
  });

  it.each([
    [{ antesDe: "abc" }],
    [{ antesDe: "0" }],
    [{ antesDe: "1.5" }],
    [{ limit: "51" }],
    [{ limit: "0" }],
    [{ page: "2" }],
  ])("rechaza %p", (query) => {
    expect(parsear(query).success).toBe(false);
  });
});
