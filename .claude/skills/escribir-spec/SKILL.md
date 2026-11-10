---
name: escribir-spec
description: Usar al arrancar cualquier feature nueva de AI Ticket It, antes de escribir código. Crea specs/NN-<feature>.md desde la plantilla, contrastando con la consigna y los planes, y hace preguntas sobre reglas faltantes. Responde en castellano rioplatense.
---

# Escribir spec de una feature

Ninguna feature se codea sin spec aprobada por el usuario. La spec es el contrato entre lo que pide la consigna y lo que la IA implementa.

## Pasos

1. **Ubicar la feature.**
   - Buscarla en `planes/06-roadmap-iteraciones.md` (iteración, nombre de rama, número de spec).
   - Identificar los CU en la tabla de trazabilidad de `planes/00-indice.md` y releer el texto literal en `CONSIGNA-TPI.md` (sección Casos de Uso).
2. **Juntar lo que ya está decidido.**
   - Reglas: `planes/02-dominio.md` (citar R1…R10).
   - Endpoints: `planes/03-api-contratos.md`.
   - Pantallas: `planes/04-frontend-pantallas.md`.
   - ADRs relacionados en `docs/decisiones/`.
   - Specs anteriores en `specs/` (no contradecirlas).
3. **Detectar huecos.** Listar todo lo que la spec necesita y los planes no responden (casos borde, mensajes de error, orden, límites). **Preguntar al usuario** en una sola tanda (máx. 4 preguntas, con opción recomendada). No inventar.
4. **Escribir** `specs/NN-<feature>.md` copiando `specs/_plantilla.md`:
   - Criterios de aceptación en Gherkin, al menos un escenario feliz y uno por cada error de negocio.
   - Plan de tests con nivel concreto por caso (ver `planes/05-testing.md`).
   - "Fuera de alcance" explícito.
   - "Notas de IA": qué propuso la IA y qué cambió el usuario.
5. **Propagar cambios.** Si la spec agrega o cambia una regla, endpoint o pantalla, actualizar el plan correspondiente en el mismo paso (los planes son la fuente de verdad).
6. **Pedir aprobación.** Mostrar resumen (reglas nuevas, endpoints, escenarios) y esperar OK. Al aprobar, cambiar estado a `aprobada`.

## Reglas

- Una spec por rama `feature/*`. Si queda con más de ~8 escenarios, proponer partirla.
- Mensajes de error con el texto exacto que va a devolver el back (voseo).
- Nunca empezar a codear en la misma respuesta en que se propone la spec.
