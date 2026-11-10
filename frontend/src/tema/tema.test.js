import { temaClaro, temaOscuro, navegacionClara, navegacionOscura, ESTADOS_COMPRA } from "./tema";
import { espaciado, radios } from "./espaciado";

function luminancia(hex) {
  const canales = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canales.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

describe.each([
  ["claro", temaClaro],
  ["oscuro", temaOscuro],
])("tema %s", (_nombre, tema) => {
  it("define los cinco estados de compra con texto, ícono y colores", () => {
    expect(Object.keys(tema.estados).sort()).toEqual([...ESTADOS_COMPRA].sort());
    for (const estado of ESTADOS_COMPRA) {
      expect(tema.estados[estado]).toEqual({
        etiqueta: expect.any(String),
        icono: expect.any(String),
        fondo: expect.stringMatching(/^#[0-9A-F]{6}$/i),
        texto: expect.stringMatching(/^#[0-9A-F]{6}$/i),
      });
    }
  });

  it.each(ESTADOS_COMPRA)("el chip %s tiene contraste AA (4.5:1)", (estado) => {
    const { fondo, texto } = tema.estados[estado];
    expect(contraste(fondo, texto)).toBeGreaterThanOrEqual(4.5);
  });

  it("el primario tiene contraste AA con su texto", () => {
    expect(contraste(tema.colors.primary, tema.colors.onPrimary)).toBeGreaterThanOrEqual(4.5);
  });
});

it.each([
  ["claro", navegacionClara, temaClaro],
  ["oscuro", navegacionOscura, temaOscuro],
])("el tema de navegación %s usa los colores de Paper", (_nombre, navegacion, tema) => {
  expect(navegacion.dark).toBe(tema.dark);
  expect(navegacion.colors.primary).toBe(tema.colors.primary);
  expect(navegacion.colors.background).toBe(tema.colors.background);
  expect(navegacion.fonts).toBeDefined();
});

it("el modo oscuro está marcado como dark", () => {
  expect(temaOscuro.dark).toBe(true);
  expect(temaClaro.dark).toBe(false);
});

it("espaciado y radios siguen la escala del sistema de diseño", () => {
  expect(espaciado).toEqual({ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 });
  expect(radios).toEqual({ sm: 8, md: 12, lg: 16 });
});
