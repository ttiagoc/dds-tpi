# Spec 16 — Arreglos de la revisión final

- **Estado:** aprobada
- **Rama:** `fix/revision-final`
- **Casos de uso:** CU12 (comprar), CU9 (reseñar), CU4 (crear evento), CU10 (reseñas del organizador) (ver `planes/00-indice.md`)
- **Iteración:** It5
- **Depende de:** revisión con el subagente `revisor-reglas-negocio` y `/code-review` sobre `develop` (7793e02)

## Contexto

Último ítem de It5. El revisor de reglas no encontró reglas violadas ni contratos rotos y confirmó la cobertura de los 12 CU; dejó un caso de CU12 sin resolver (comprar un evento pasado) y desajustes de documentación. `/code-review` encontró diez problemas del front, todos verificados en el código. El usuario delegó la selección: se aplica lo que mejora el cumplimiento de la consigna y el funcionamiento; lo descartado queda justificado abajo.

## Reglas de negocio

No agrega reglas. RN1 expone en el contrato el resultado de R1 que hoy el front no puede conocer (evento ocurrido), calculado por el dominio (`Evento.yaOcurrio(ahora)`, `fecha <= ahora`), para que el front no lo recalcule.

## Contrato de API

- `EventoResumen` (y por extensión `EventoDetalle`, el resumen de `GET /organizadores/yo/eventos` y `GET /usuarios/yo/favoritos`) suma **`finalizado: boolean`** = `evento.yaOcurrio(ahora)`. Actualizado en `planes/03-api-contratos.md` y en Swagger.

## Cambios

| # | Origen | Dónde | Cambio |
|---|---|---|---|
| RN1 | revisor | back `EventoService.toResumen`, Swagger; front `DetalleEvento`, `TarjetaEventoPropio` | `finalizado` en el resumen. DetalleEvento no ofrece "Comprar" en un evento finalizado: muestra "Evento finalizado" (`testID="evento-finalizado"`). `TarjetaEventoPropio` usa `evento.finalizado` (también corrige `<` vs `<=` respecto del dominio). |
| CR1 | code-review | `app/_layout.jsx` | Mientras se restaura la sesión (`cargando`), `Navegacion` muestra `Cargando` en lugar de montar el `Stack` con guards sin usuario: un deep link o una recarga en web conserva la ruta pedida. |
| CR2 | code-review | `hooks/useCargar.js` | Si falla una recarga habiendo datos, se conservan los datos (el detalle no se reemplaza por pantalla de error). 403/404 siguen mostrando el aviso de `ConCarga`. |
| CR3 | code-review | `pantallas/comprar/useCompra.js` | Si el tipo elegido se agota tras recargar (422 sin cupo), la selección queda vacía y "Confirmar compra" deshabilitado hasta elegir otro; no se cambia de tipo sin avisar. |
| CR7 | code-review | `pantallas/detalle-evento/DetalleEvento.jsx` | Recarga al volver a la pantalla (`useRecargarAlVolver`), como DetalleCompra: disponibilidad al día después de comprar. |
| CR4 | code-review | `hooks/useEnvio.js` | `alResolver` se ejecuta fuera del `try` del pedido: un error posterior a una respuesta exitosa no se muestra como error de conexión. |
| CR8 | code-review | `hooks/useEnvio.js`, `pantallas/resenar/useResenia.js` | `useEnvio` recarga también ante 409; Reseñar le pasa `recargar`, así un 409 "Ya reseñaste esta compra" lleva a "no disponible". |
| CR9 | code-review | `components/ErrorEnLinea` (nuevo), `SelectorCategoria`, `ReseniasOrganizador` | Componente compartido de error en línea con "Reintentar" (`HelperText` + botón texto). |
| CR10 | code-review | `components/Pantalla.jsx`, `pantallas/resenar/Resenar.jsx` | Se quita la rama `RefreshControl` sin uso de `Pantalla` y el `StyleSheet` vacío de Reseñar. |
| RN6/7 | revisor | `planes/00-indice.md` | Trazabilidad de CU7 sin el "e2e cancelar" inexistente; estado de It1–It4 tildado. |

## Criterios de aceptación

```gherkin
Escenario: el contrato informa si el evento ya ocurrió
  Dado "Rock en el Parque" (hace 30 días) y "Los Piojos en River" (en 12 días)
  Cuando se pide GET /eventos/:id de cada uno
  Entonces "finalizado" es true y false respectivamente
  Y aparece también en /eventos, /organizadores/yo/eventos y /usuarios/yo/favoritos

Escenario: no se ofrece comprar un evento finalizado
  Dado un evento finalizado abierto desde Favoritos
  Entonces no aparece "Comprar" y se ve "Evento finalizado"

Escenario: recargar una ruta protegida conserva la ruta
  Dado una sesión guardada
  Mientras se restaura la sesión
  Entonces se muestra Cargando y no se redirige

Escenario: una recarga fallida conserva los datos
  Dado el detalle de una compra ya cargado
  Cuando una recarga falla por red
  Entonces se sigue viendo la compra

Escenario: el tipo elegido se agota
  Dado que Ana eligió VIP y la compra devuelve 422 por falta de cupo
  Cuando la recarga muestra VIP agotado
  Entonces no queda ningún tipo elegido y "Confirmar compra" está deshabilitado

Escenario: la reseña ya existía
  Dado que el back responde 409 al reseñar
  Entonces se muestra el mensaje y la pantalla se recarga
```

## Plan de tests

| Nivel | Caso |
|---|---|
| Integración back | `finalizado` en detalle (pasado y futuro), búsqueda, eventos del organizador y favoritos; Swagger con el campo |
| Front (RNTL) | DetalleEvento finalizado sin Comprar; DetalleEvento recarga al volver; navegación muestra Cargando mientras restaura; `useCargar` conserva datos si falla la recarga; `useSeleccion` sin tipo cuando el elegido se agota; `useEnvio` no reporta errores de `alResolver` y recarga con 409; `ErrorEnLinea`; `TarjetaEventoPropio` con `finalizado` |
| E2E | 3/3 como regresión |

## Fuera de alcance (descartado con motivo)

- CR6 socket compartido: decisión de la spec 12 (RC2), un `compra:salir` compartido sacaría al detalle del room.
- CR5 GET extra al recibir `compra:estado` por una acción propia: costo mínimo, sin efecto visible.
- RN2 texto de reembolso según CONFIRMADA: aceptado en la spec 10c2.
- RN3 máximo de 10 por compra duplicado: constante espejo documentada en la spec 10b.
- RN5 `ESTADOS_COMPRA` en el front: espejo deliberado para el tema.

## Notas de IA

- Hallazgos de dos revisiones independientes (subagente de reglas y `/code-review`); la IA verificó cada uno contra el código antes de proponerlo y descartó los que contradecían decisiones previas.
- CR1 resultó ser la causa de un comportamiento que se había anotado como limitación ("el deep link en frío cae a las tabs").
