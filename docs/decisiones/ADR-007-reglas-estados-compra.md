# ADR-007 — Reglas de transición de estados de la compra

- **Fecha:** 2026-11-10
- **Estado:** aceptada (revisar al escribir spec 04-compras)

## Contexto
La consigna define estados (PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA) pero no cómo se pasa de uno a otro ni hay pasarela de pago.

## Decisión
- Pago simulado: el comprador toca "Pagar" → CONFIRMADA.
- Cancelar PENDIENTE → CANCELADA. Cancelar CONFIRMADA → CANCELADA y automáticamente REEMBOLSADA (dos registros en el historial).
- Cancelar prohibido si UTILIZADA o el evento ya ocurrió (CU8).
- UTILIZADA la marca el organizador del evento desde CONFIRMADA; se permite antes de la fecha para poder demostrar el flujo de reseñas.
- Cupo se reserva al crear la compra y se libera al cancelar.
- Tabla `TRANSICIONES` en el dominio; cualquier otra transición → 422.
- Las compras PENDIENTE no vencen (simplificación).

## Consecuencias
- Reglas centralizadas en `Compra`; el back devuelve `acciones` calculadas para que el front no las duplique.

## Rol de la IA
Propuesta de la IA validada por el usuario ("botones simulados").
