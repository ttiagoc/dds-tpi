import { leerQrDeEntrada, textoDelQr } from "./qrDeEntrada";

describe("qrDeEntrada", () => {
  it("arma el texto con la compra y el número de entrada", () => {
    expect(textoDelQr(7, 2)).toBe("aiticketit:compra:7:entrada:2");
  });

  it("lee la compra y el número de un QR propio", () => {
    expect(leerQrDeEntrada("aiticketit:compra:42:entrada:3")).toEqual({
      compraId: 42,
      numero: 3,
    });
  });

  it.each([
    ["otro prefijo", "https://ejemplo.com/7"],
    ["el formato viejo, sin entrada", "aiticketit:compra:7"],
    ["id no numérico", "aiticketit:compra:abc:entrada:1"],
    ["entrada cero", "aiticketit:compra:7:entrada:0"],
    ["texto extra al final", "aiticketit:compra:7:entrada:1x"],
    ["vacío", ""],
    ["sin texto", undefined],
  ])("devuelve null con %s", (_, texto) => {
    expect(leerQrDeEntrada(texto)).toBeNull();
  });
});
