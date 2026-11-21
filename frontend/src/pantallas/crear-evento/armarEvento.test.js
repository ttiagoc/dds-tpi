import {
  MENSAJES,
  armarEvento,
  erroresDelBack,
  formularioVacio,
  tipoVacio,
  validarEvento,
} from "./armarEvento";

const COMPLETO = {
  nombre: "  Stand-up en el Konex ",
  descripcion: " Noche de humor ",
  lugar: " Ciudad Cultural Konex ",
  direccion: " Sarmiento 3131, CABA, Buenos Aires ",
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
      direccion: "Sarmiento 3131, CABA, Buenos Aires",
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

  it("manda la ruta relativa de la imagen subida", () => {
    const evento = armarEvento({ ...COMPLETO, imagen: "/imagenes/subidas/x.jpg" });
    expect(evento.multimedia).toEqual(["/imagenes/subidas/x.jpg"]);
  });
});

describe("validarEvento", () => {
  const AHORA = new Date(2026, 10, 21, 12, 0);

  it("un formulario completo no tiene errores", () => {
    expect(validarEvento(COMPLETO, AHORA)).toEqual({});
  });

  it("un formulario recién abierto marca todos los campos en orden", () => {
    expect(Object.entries(validarEvento(formularioVacio(), AHORA))).toEqual([
      ["nombre", MENSAJES.nombre],
      ["descripcion", MENSAJES.descripcion],
      ["lugar", MENSAJES.lugar],
      ["direccion", MENSAJES.direccion],
      ["categoria", MENSAJES.categoria],
      ["fecha", MENSAJES.fecha],
      ["hora", MENSAJES.hora],
      ["tiposEntrada.0.nombre", MENSAJES.tipoNombre],
      ["tiposEntrada.0.precio", MENSAJES.precio],
      ["tiposEntrada.0.cupo", MENSAJES.cupo],
    ]);
  });

  it.each([
    ["nombre corto", { nombre: " ab " }, "nombre"],
    ["nombre largo", { nombre: "a".repeat(101) }, "nombre"],
    ["sin hora", { hora: null }, "hora"],
    ["sin categoría", { categoria: null }, "categoria"],
    ["dirección sin localidad", { direccion: "Sarmiento 3131" }, "direccion"],
    ["dirección sin número", { direccion: "Sarmiento, CABA" }, "direccion"],
  ])("con %s marca solo ese campo", (_, cambio, campo) => {
    expect(Object.keys(validarEvento({ ...COMPLETO, ...cambio }, AHORA))).toEqual([campo]);
  });

  it.each([
    ["un día pasado", { dia: new Date(2026, 10, 20) }],
    [
      "hoy a una hora que ya pasó",
      { dia: new Date(2026, 10, 21), hora: { hours: 11, minutes: 0 } },
    ],
    ["ahora mismo", { dia: new Date(2026, 10, 21), hora: { hours: 12, minutes: 0 } }],
  ])("con %s pide una fecha futura", (_, cambio) => {
    expect(validarEvento({ ...COMPLETO, ...cambio }, AHORA)).toEqual({ fecha: MENSAJES.futura });
  });

  it.each([
    ["precio vacío", { precio: "" }, "precio"],
    ["precio no numérico", { precio: "abc" }, "precio"],
    ["precio negativo", { precio: "-1" }, "precio"],
    ["cupo 0", { cupo: "0" }, "cupo"],
    ["cupo con decimales", { cupo: "1.5" }, "cupo"],
    ["tipo sin nombre", { nombre: " " }, "nombre"],
  ])("con %s marca el campo del segundo tipo", (_, cambio, campo) => {
    const tipos = [COMPLETO.tipos[0], { ...COMPLETO.tipos[0], clave: 2, ...cambio }];
    expect(Object.keys(validarEvento({ ...COMPLETO, tipos }, AHORA))).toEqual([
      `tiposEntrada.1.${campo}`,
    ]);
  });

  it("acepta el precio con coma decimal y lo manda como número", () => {
    const tipos = [{ ...COMPLETO.tipos[0], precio: "1500,50" }];
    expect(validarEvento({ ...COMPLETO, tipos }, AHORA)).toEqual({});
    expect(armarEvento({ ...COMPLETO, tipos }).tiposEntrada[0].precio).toBe(1500.5);
  });
});

describe("erroresDelBack", () => {
  it("lleva los details del back a las claves del formulario", () => {
    expect(
      erroresDelBack([
        { campo: "categoriaId", mensaje: "La categoría no existe" },
        { campo: "tiposEntrada.0.cupo", mensaje: "Muy chico" },
      ]),
    ).toEqual({ categoria: "La categoría no existe", "tiposEntrada.0.cupo": "Muy chico" });
  });

  it("sin details no hay errores de campo", () => {
    expect(erroresDelBack(undefined)).toEqual({});
  });
});

describe("tipoVacio", () => {
  it("arma un tipo sin datos con la clave pedida", () => {
    expect(tipoVacio(3)).toEqual({ clave: 3, nombre: "", precio: "", cupo: "", descripcion: "" });
  });
});
