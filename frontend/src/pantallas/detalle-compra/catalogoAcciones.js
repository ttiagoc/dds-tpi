import { cancelarCompra, marcarUtilizada, pagarCompra } from "../../api/comprasApi";
import { formatearPrecio } from "../../utils/formato";

function textoDeCancelacion({ estado, cantidad, total }) {
  const entradas = cantidad === 1 ? "Se libera la entrada" : `Se liberan las ${cantidad} entradas`;
  return estado === "CONFIRMADA"
    ? `${entradas} y se te reembolsan ${formatearPrecio(total)}.`
    : `${entradas}.`;
}

export const ACCIONES_COMPRA = [
  {
    nombre: "resenar",
    permiso: "puedeReseniar",
    etiqueta: "Reseñar",
    icono: "star-outline",
    testID: "compra-resenar",
    ruta: (compra) => `/compras/${compra.id}/resenia`,
  },
  {
    nombre: "utilizar",
    permiso: "puedeMarcarUtilizada",
    etiqueta: "Marcar utilizada",
    icono: "ticket-confirmation-outline",
    testID: "compra-utilizada",
    pedir: marcarUtilizada,
    aviso: () => "Entrada marcada como utilizada",
    confirmacion: {
      titulo: "¿Marcar la entrada como utilizada?",
      texto: () => "El comprador va a poder reseñar la compra. No se puede deshacer.",
      boton: "Marcar",
      testID: "confirmar-utilizada",
    },
  },
  {
    nombre: "pagar",
    permiso: "puedePagar",
    etiqueta: "Pagar",
    icono: "credit-card-outline",
    testID: "compra-pagar",
    pedir: pagarCompra,
    aviso: () => "Pago confirmado",
  },
  {
    nombre: "cancelar",
    permiso: "puedeCancelar",
    etiqueta: "Cancelar compra",
    testID: "compra-cancelar",
    modo: "outlined",
    destructiva: true,
    pedir: cancelarCompra,
    aviso: (compra) =>
      compra.estado === "REEMBOLSADA" ? "Compra cancelada y reembolsada" : "Compra cancelada",
    confirmacion: {
      titulo: "¿Cancelar la compra?",
      texto: textoDeCancelacion,
      boton: "Cancelar compra",
      testID: "confirmar-cancelacion",
    },
  },
  {
    nombre: "chat",
    etiqueta: "Chat",
    icono: "chat-outline",
    testID: "compra-chat",
    modo: "outlined",
    ruta: (compra) => `/compras/${compra.id}/chat`,
  },
];

export const accionVisible = (accion, permitidas) =>
  !accion.permiso || !!permitidas[accion.permiso];

export const accionDeCompra = (nombre) => ACCIONES_COMPRA.find((a) => a.nombre === nombre);
