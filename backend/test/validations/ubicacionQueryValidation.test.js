import { describe, it, expect } from "@jest/globals";
import { ubicacionQueryValidation } from "../../src/validations/ubicacionQueryValidation.js";

const QUERY = { calle: " Sarmiento ", numero: "3131", localidad: "Balvanera", provincia: "CABA" };
const parsear = (query) => ubicacionQueryValidation.safeParse(query);
const camposConError = (query) => parsear(query).error.issues.map((i) => i.path.join("."));

describe("ubicacionQueryValidation", () => {
  it("recorta los textos y convierte el número", () => {
    expect(parsear(QUERY).data).toEqual({
      calle: "Sarmiento",
      numero: 3131,
      localidad: "Balvanera",
      provincia: "CABA",
    });
  });

  it.each([
    [{ ...QUERY, calle: " " }, "calle"],
    [{ ...QUERY, numero: "0" }, "numero"],
    [{ ...QUERY, numero: "12a" }, "numero"],
    [{ ...QUERY, numero: "100000" }, "numero"],
    [{ ...QUERY, localidad: "a".repeat(101) }, "localidad"],
    [{ calle: "x", numero: "1", localidad: "y" }, "provincia"],
  ])("rechaza %p", (query, campo) => {
    expect(camposConError(query)).toEqual([campo]);
  });

  it("rechaza parámetros de más", () => {
    expect(parsear({ ...QUERY, pais: "AR" }).success).toBe(false);
  });
});
