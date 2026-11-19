import { claveDeDia, etiquetaDeDia } from "../../utils/formato";

export function conSeparadores(mensajes, opciones = {}) {
  const items = [];
  let diaAnterior = null;
  for (const mensaje of mensajes) {
    const dia = claveDeDia(mensaje.enviado, opciones);
    if (dia !== diaAnterior) {
      items.push({
        clave: `dia-${dia}`,
        dia: { clave: dia, etiqueta: etiquetaDeDia(mensaje.enviado, opciones) },
      });
      diaAnterior = dia;
    }
    items.push({ clave: `mensaje-${mensaje.id}`, mensaje });
  }
  return items;
}
