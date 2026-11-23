const FORMATO = /^aiticketit:compra:([1-9]\d*):entrada:([1-9]\d*)$/;

export const textoDelQr = (compraId, numero) => `aiticketit:compra:${compraId}:entrada:${numero}`;

export function leerQrDeEntrada(texto) {
  const partes = typeof texto === "string" ? FORMATO.exec(texto) : null;
  if (!partes) return null;
  return { compraId: Number(partes[1]), numero: Number(partes[2]) };
}
