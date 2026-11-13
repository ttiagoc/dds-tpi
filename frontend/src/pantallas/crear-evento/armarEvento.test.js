import { armarEvento, estaCompleto, formularioVacio, tipoVacio } from "./armarEvento";

const COMPLETO = {
  nombre: "  Stand-up en el Konex ",
  descripcion: " Noche de humor ",
  lugar: " Ciudad Cultural Konex ",
  imagen: "",
  categoria: { id: 6, nombre: "Stand-up" },
  dia: new Date(2026, 11, 5),
  hora: { hours: 22, minutes: 0 },
  tipos: [{ clave: 1, nombre: " General ", precio: "15000", cupo: "200", descripcion: "  " }],
};

describe("armarEvento", () => {
  it("arma el body con textos sin espacios, números, fecha local en ISO y sin imagen", () => {
    expect(armarEvento(COMPLETO)).toEqual({
      nombre: "Stand-up en el Konex",
      descripcion: "Noche de humor",
      categoriaId: 6,
      fecha: new Date(2026, 11, 5, 22, 0).toISOString(),
      lugar: "Ciudad Cultural Konex",
      multimedia: [],
      tiposEntrada: [{ nombre: "General", precio: 15000, cupo: 200 }],
    });
  });

  it("incluye la imagen y la descripción del tipo cuando están", () => {
    const evento = armarEvento({
      ...COMPLETO,
      imagen: " https://imagenes.test/konex.jpg ",
      tipos: [{ ...COMPLETO.tipos[0], descripcion: " De pie " }],
    });
    expect(evento.multimedia).toEqual(["https://imagenes.test/konex.jpg"]);
    expect(evento.tiposEntrada[0].descripcion).toBe("De pie");
  });

  it("manda los números tal cual aunque el back los vaya a rechazar", () => {
    const evento = armarEvento({
      ...COMPLETO,
      tipos: [{ ...COMPLETO.tipos[0], precio: "-5", cupo: "0" }],
    });
    expect(evento.tiposEntrada[0]).toMatchObject({ precio: -5, cupo: 0 });
  });
});

describe("estaCompleto", () => {
  it("un formulario recién abierto no está completo", () => {
    expect(estaCompleto(formularioVacio())).toBe(false);
  });

  it("con todos los campos está completo", () => {
    expect(estaCompleto(COMPLETO)).toBe(true);
  });

  it.each([
    ["nombre", { nombre: "  " }],
    ["descripción", { descripcion: "" }],
    ["lugar", { lugar: "" }],
    ["categoría", { categoria: null }],
    ["día", { dia: null }],
    ["hora", { hora: null }],
  ])("sin %s no está completo", (_, cambio) => {
    expect(estaCompleto({ ...COMPLETO, ...cambio })).toBe(false);
  });

  it.each([
    ["nombre", { nombre: "" }],
    ["precio", { precio: "" }],
    ["precio no numérico", { precio: "abc" }],
    ["cupo", { cupo: "" }],
  ])("con un tipo sin %s no está completo", (_, cambio) => {
    const tipos = [COMPLETO.tipos[0], { ...COMPLETO.tipos[0], clave: 2, ...cambio }];
    expect(estaCompleto({ ...COMPLETO, tipos })).toBe(false);
  });

  it("tipoVacio arma un tipo sin datos con la clave pedida", () => {
    expect(tipoVacio(3)).toEqual({ clave: 3, nombre: "", precio: "", cupo: "", descripcion: "" });
  });
});
