---
name: cerrar-feature
description: Usar al terminar una feature o fix de AI Ticket It, antes de commitear o mergear a develop. Verifica la definición de terminado (tests, lint, Swagger, spec, bitácora, ADR) con evidencia y propone commit y merge.
---

# Cerrar feature

No afirmar que algo está terminado sin haber corrido los comandos en esta sesión y mostrado la salida.

## 1. Verificar (con evidencia)

```bash
cd backend && npm test          # si se tocó el back
cd frontend && npm test         # si se tocó el front
npm run calidad                 # desde la raíz: eslint + jscpd (duplicados)
npm run e2e                     # si la feature está en un flujo e2e
git status && git diff --stat
```

Si algo falla → arreglar o reportar tal cual; no seguir.

## 2. Definición de terminado

- [ ] Todos los criterios de aceptación de la spec cumplidos (repasar uno por uno, decir cómo se verificó cada uno).
- [ ] Spec en estado `implementada`.
- [ ] Planes actualizados si cambió algún contrato o regla.
- [ ] Swagger actualizado (si cambió la API).
- [ ] Probado en Expo Go (si hay UI) — si no se pudo, decirlo.
- [ ] Sin `console.log`, código comentado ni TODOs sin dueño.
- [ ] `planes/06-roadmap-iteraciones.md`: tildar el ítem.
- [ ] ADR nuevo si se tomó una decisión de diseño.
- [ ] Entrada de bitácora (skill `bitacora-ia`).

## 3. Revisión

- **Siempre:** skill `revisar-calidad` (repetición, capas y modularización) sobre el diff de la rama.
- Para features con lógica de negocio, además: subagente `revisor-reglas-negocio` sobre el diff, o `/code-review`. Aplicar lo que corresponda y anotar en la bitácora lo que la revisión encontró.

## 4. Commit y merge (solo si el usuario lo pide)

Proponer mensajes de una línea, castellano, tercera persona presente:

- "Agrega cancelación de compras con reembolso"
- "Corrige cálculo de días restantes en compras confirmadas"

Merge local (ver `GITFLOW.md`):

```bash
git checkout develop
git merge --no-ff feature/<nombre> -m "Mergea feature/<nombre>"
git branch -d feature/<nombre>
```

Si es el último ítem de la iteración, proponer el cierre (`main` + tag `itN`).
