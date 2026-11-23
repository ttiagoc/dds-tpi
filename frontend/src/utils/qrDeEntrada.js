const PREFIJO = "aiticketit:compra:";

export const textoDelQr = (compraId) => `${PREFIJO}${compraId}`;

export function leerQrDeEntrada(texto) {
  if (typeof texto !== "string" || !texto.startsWith(PREFIJO)) return null;
  const id = texto.slice(PREFIJO.length);
  return /^[1-9]\d*$/.test(id) ? Number(id) : null;
}
