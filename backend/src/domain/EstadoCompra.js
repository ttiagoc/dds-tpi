export const EstadoCompra = Object.freeze({
  PENDIENTE: "PENDIENTE",
  CONFIRMADA: "CONFIRMADA",
  UTILIZADA: "UTILIZADA",
  CANCELADA: "CANCELADA",
  REEMBOLSADA: "REEMBOLSADA",
});

/*
            pagar                 marcarUtilizada
PENDIENTE ─────────▶ CONFIRMADA ─────────────────▶ UTILIZADA
    │                    │
    │ cancelar           │ cancelar
    ▼                    ▼
CANCELADA ◀──────────────┘ ──(solo si venía de CONFIRMADA)──▶ REEMBOLSADA
*/
export const TRANSICIONES = Object.freeze({
  PENDIENTE: Object.freeze([EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA]),
  CONFIRMADA: Object.freeze([EstadoCompra.UTILIZADA, EstadoCompra.CANCELADA]),
  CANCELADA: Object.freeze([EstadoCompra.REEMBOLSADA]),
  UTILIZADA: Object.freeze([]),
  REEMBOLSADA: Object.freeze([]),
});
