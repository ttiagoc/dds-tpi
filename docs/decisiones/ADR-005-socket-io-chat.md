# ADR-005 — Socket.io para el chat de la compra

- **Fecha:** 2026-11-10
- **Estado:** aceptada

## Contexto
CU5/CU6: comprador y organizador intercambian mensajes "en cualquier momento".

## Opciones
1. Polling REST cada N segundos — simple, sin infraestructura, latencia y requests de más.
2. **Socket.io** — tiempo real, tecnología nueva para aprender (valorado por la consigna), más piezas.

## Decisión
Socket.io en el mismo servidor HTTP. **El envío sigue siendo REST** (`POST /compras/:id/mensajes`: valida, persiste, responde); el service emite `mensaje:nuevo` al room `compra:<id>` después de persistir. El socket solo notifica.

## Consecuencias
- Reglas y validaciones en un solo lugar (service), testeables sin socket.
- Si el socket falla, el chat sigue funcionando con refresco manual.
- En Expo Go: `transports: ["websocket"]`.

## Rol de la IA
La IA recomendaba polling por simplicidad; se eligió Socket.io por valor de aprendizaje y se mitigó el riesgo con el diseño "REST para escribir, socket para notificar".
