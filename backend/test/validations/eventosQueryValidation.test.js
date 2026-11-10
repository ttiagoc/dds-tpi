import { describe, it, expect } from "@jest/globals";
import { eventosQueryValidation } from "../../src/validations/eventosQueryValidation.js";

const parsear = (query) => eventosQueryValidation.safeParse(query);
const camposConError = (resultado) => resultado.error.issues.map((issue) => issue.path.join("."));

describe("eventosQueryValidation", () => {
  it("aplica los valores por defecto", () => {
    expect(parsear({}).data).toEqual({
      ordenarPor: "fecha",
      orden: "asc",
      incluirPasados: false,
      page: 1,
      limit: 20,
    });
  });

  it("ordena desc por defecto cuando se ordena por puntaje", () => {
    expect(parsear({ ordenarPor: "puntaje" }).data.orden).toBe("desc");
    expect(parsear({ ordenarPor: "puntaje", orden: "asc" }).data.orden).toBe("asc");
  });

  it("convierte los números que llegan como texto", () => {
    const { data } = parsear({
      categoria: "3",
      precioMin: "1000",
      precioMax: "2500.5",
      page: "2",
      limit: "5",
    });
    expect(data).toMatchObject({
      categoria: 3,
      precioMin: 1000,
      precioMax: 2500.5,
      page: 2,
      limit: 5,
    });
  });

  it("recorta q y lo ignora si queda vacío", () => {
    expect(parsear({ q: "  piojos " }).data.q).toBe("piojos");
    expect(parsear({ q: "   " }).data.q).toBeUndefined();
  });

  it("aplica el límite de 100 caracteres a q ya recortado", () => {
    expect(parsear({ q: ` ${"a".repeat(100)} ` }).data.q).toHaveLength(100);
    expect(parsear({ q: " ".repeat(101) }).data.q).toBeUndefined();
  });

  it.each(["precioMin", "precioMax", "categoria", "page", "limit"])(
    "ignora %s vacío o con solo espacios",
    (campo) => {
      expect(parsear({ [campo]: "" }).data).toEqual(parsear({}).data);
      expect(parsear({ [campo]: "  " }).data).toEqual(parsear({}).data);
    },
  );

  it.each([
    ["true", true],
    ["false", false],
  ])("acepta incluirPasados=%s", (valor, esperado) => {
    expect(parsear({ incluirPasados: valor }).data.incluirPasados).toBe(esperado);
  });

  it.each([
    ["incluirPasados que no es true/false", { incluirPasados: "si" }, "incluirPasados"],
    ["limit mayor a 50", { limit: "51" }, "limit"],
    ["page 0", { page: "0" }, "page"],
    ["ordenarPor fuera de los valores", { ordenarPor: "nombre" }, "ordenarPor"],
    ["orden fuera de los valores", { orden: "arriba" }, "orden"],
    ["precio negativo", { precioMin: "-1" }, "precioMin"],
    ["categoría que no es un número", { categoria: "abc" }, "categoria"],
    ["categoría 0", { categoria: "0" }, "categoria"],
    ["q de más de 100 caracteres", { q: "a".repeat(101) }, "q"],
  ])("rechaza %s", (_caso, query, campo) => {
    const resultado = parsear(query);
    expect(resultado.success).toBe(false);
    expect(camposConError(resultado)).toContain(campo);
  });

  it("rechaza precioMin mayor que precioMax con el detalle en precioMin", () => {
    const resultado = parsear({ precioMin: "500", precioMax: "100" });
    expect(resultado.success).toBe(false);
    expect(resultado.error.issues).toEqual([
      expect.objectContaining({
        path: ["precioMin"],
        message: "precioMin no puede ser mayor que precioMax",
      }),
    ]);
  });

  it("acepta precioMin igual a precioMax y un solo borde", () => {
    expect(parsear({ precioMin: "100", precioMax: "100" }).success).toBe(true);
    expect(parsear({ precioMax: "100" }).success).toBe(true);
  });

  it("rechaza parámetros desconocidos", () => {
    expect(parsear({ nombre: "x" }).success).toBe(false);
  });
});
