import { leerQrDeEntrada, textoDelQr } from "./qrDeEntrada";

describe("qrDeEntrada", () => {
  it("arma el texto con el id de la compra", () => {
    expect(textoDelQr(7)).toBe("aiticketit:compra:7");
  });

  it("lee el id de un QR propio", () => {
    expect(leerQrDeEntrada("aiticketit:compra:42")).toBe(42);
  });

  it.each([
    ["otro prefijo", "https://ejemplo.com/7"],
    ["id no numérico", "aiticketit:compra:abc"],
    ["id cero", "aiticketit:compra:0"],
    ["id con decimales", "aiticketit:compra:7.5"],
    ["vacío", ""],
    ["sin texto", undefined],
  ])("devuelve null con %s", (_, texto) => {
    expect(leerQrDeEntrada(texto)).toBeNull();
  });
});
