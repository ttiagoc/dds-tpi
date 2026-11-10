# 08 — Guion del video (5-10 min)

La consigna pide: un flujo elegido explicado en back, en front y recorrido en la UI, más una conclusión sobre el uso de IA.

## Flujo elegido (propuesto): Compra de una entrada y su ciclo de vida

Cubre CU3, CU12, CU1, CU7/CU8 y el chat (CU5/CU6): toca dominio rico (cupo, máquina de estados), permisos, socket y varias pantallas.

## Guion

| Min | Bloque | Qué mostrar |
|---|---|---|
| 0:00-0:30 | Intro | Qué es AI Ticket It, stack (Express + Expo), cómo está organizado el repo |
| 0:30-2:30 | UI (celular, Expo Go con mirroring) | Login Ana → Explorar → buscar "rock" / chip Recitales → ordenar por precio → detalle → Comprar 2 Campo → Mis compras (PENDIENTE) → Pagar → CONFIRMADA "faltan N días" → Chat: mensaje que llega en vivo al organizador (segundo dispositivo o web) → Cancelar → REEMBOLSADA, timeline |
| 2:30-4:30 | Back-end | `POST /compras`: route → validate(zod) → controller → `CompraService.crear` → `TipoEntrada.reservar` → repo. `Compra.cancelar` + `TRANSICIONES`. Errores 422. Tests de dominio corriendo. Swagger |
| 4:30-6:00 | Front-end | `app/eventos/[id]/comprar.jsx`, `comprasApi.js`, `cliente.js` con token, `ChipEstado`, `useChatCompra` + socket |
| 6:00-6:30 | Calidad | `npm test` + un spec de Cypress corriendo |
| 6:30-9:00 | Conclusión IA | skills creadas y por qué; ejemplos concretos de bitácora (aciertos y errores); ventajas/desventajas; dificultades; aprendizajes; valoración personal |

## Preparación

- [ ] Seed con eventos lindos y reseñas.
- [ ] Back reiniciado (datos limpios) antes de grabar.
- [ ] Mirroring del celular (scrcpy en Android) o grabar Expo Web en viewport mobile como respaldo.
- [ ] Editor con archivos abiertos en orden.
- [ ] Ensayo cronometrado.
