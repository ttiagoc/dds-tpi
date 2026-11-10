# ADR-008 — Ajustes de la revisión de ingeniería de los planes

- **Fecha:** 2026-11-10
- **Estado:** aceptada

## Contexto
Antes de It1 se hizo una revisión de ingeniería (`/plan-eng-review`) de `planes/01`, `02` y `03`. Aparecieron diez puntos donde los planes eran inconsistentes entre sí o no se podían implementar tal como estaban escritos.

## Opciones
Para cada hallazgo se propuso aplicarlo o dejarlo como estaba. Para las referencias de `Compra` se evaluó también conservar la instancia compartida y documentar la invariante con un test.

## Decisión
1. `crearContenedor(overrides)` crea cada repositorio una sola vez y se lo inyecta explícitamente a cada service. Expone `resetear()` para `/test/reset`. Los defaults del constructor quedan solo para tests unitarios.
2. Los constructores de dominio validan la forma y permiten rehidratar objetos. Las reglas que dependen de la fecha actual van en factories (`Evento.crear(datos, ahora)`, `Compra.crear(..., ahora)`), así el seed puede construir eventos pasados.
3. `Compra` guarda `tipoEntradaId` y obtiene el tipo de entrada desde el evento.
4. El backend no arranca si falta `JWT_SECRET` fuera de `NODE_ENV=test`.
5. Una compra solo pasa a REEMBOLSADA dentro de `cancelar()` y solo si estaba CONFIRMADA (R2b).
6. `Mensaje.usuario` incluye `rol`, como pide el contrato.
7. `apellido` es opcional. En los resúmenes, `nombre` es `nombreCompleto()`.
8. Se agrega el middleware `autenticarOpcional` para calcular `esFavorito` en endpoints públicos.
9. Se suman casos de test y un `coverageThreshold` del 80% en `domain/` y `services/`.
10. El promedio por organizador se calcula una sola vez por request.

## Consecuencias
Los planes 01, 02 y 05 y `AGENTS.md` quedaron actualizados. El seed no necesita esquivar validaciones y el cupo tiene una única fuente de verdad.

## Rol de la IA
La IA detectó los diez puntos y propuso una solución para cada uno. El usuario aprobó las diez soluciones recomendadas.
