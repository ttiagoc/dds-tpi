import { cancelarCompra, marcarUtilizada, pagarCompra } from "../../api/comprasApi";
import { formatearPrecio } from "../../utils/formato";

function textoDeCancelacion({ estado, cantidad, total }) {
  const entradas = cantidad === 1 ? "Se libera la entrada" : `Se liberan las ${cantidad} entradas`;
  return estado === "CONFIRMADA"
    ? `${entradas} y se te reembolsan ${formatearPrecio(total)}.`
    : `${entradas}.`;
}

const esReserva = (compra) => compra.estado === "PENDIENTE";

export const segun = (valor, compra) => (typeof valor === "function" ? valor(compra) : valor);

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
    etiqueta: (compra) => (esReserva(compra) ? "Liberar reserva" : "Pedir reembolso"),
    testID: "compra-cancelar",
    modo: (compra) => (esReserva(compra) ? "text" : "outlined"),
    nota: (compra) =>
      esReserva(compra) ? "Tus entradas quedan reservadas hasta que pagues." : null,
    destructiva: true,
    pedir: cancelarCompra,
    aviso: (compra) =>
      compra.estado === "REEMBOLSADA" ? "Compra cancelada y reembolsada" : "Reserva liberada",
    confirmacion: {
      titulo: (compra) => (esReserva(compra) ? "¿Liberar la reserva?" : "¿Pedir el reembolso?"),
      texto: textoDeCancelacion,
      boton: (compra) => (esReserva(compra) ? "Liberar" : "Pedir reembolso"),
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
