---
name: bitacora-ia
description: Usar al final de cada sesión de trabajo con IA en AI Ticket It (o cuando el usuario pida registrar algo en la bitácora). Agrega una entrada honesta a docs/ia/bitacora.md con lo que la IA hizo bien, lo que hubo que corregir y lo aprendido; es insumo directo para la conclusión del video.
---

# Bitácora de IA

La consigna evalúa el **criterio** al usar IA. La bitácora es la evidencia: tiene que ser concreta y honesta, incluidos los errores de la IA (incluido Claude).

## Pasos

1. Repasar la sesión: pedidos del usuario, skills usadas, archivos tocados (`git diff --stat`), tests corridos, correcciones que hizo el usuario o que surgieron de tests/revisión.
2. Agregar una sección al final de `docs/ia/bitacora.md` con este formato:

```markdown
## Sesión N — AAAA-MM-DD — <título corto>

- **Objetivo:**
- **Herramienta / skill:** (Claude Code + skills usadas; otras herramientas si las hubo)
- **Prompt (resumen):**
- **Resultado:** qué se generó (archivos/feature), qué salió bien a la primera.
- **Correcciones:** qué estaba mal y por qué (alucinó API/versión, ignoró regla, sobre-ingeniería, estilo, test que no testeaba nada…). Cómo se detectó (test, revisión, prueba en celular).
- **Tiempo:** real y estimado sin IA.
- **Aprendizaje:** concepto/tecnología nueva entendida o regla nueva para una skill.
- **Mejora al proceso:** skill/plan/AGENTS.md modificado a raíz de esto (o "ninguna").
```

3. Actualizar la tabla "Resumen acumulado" y la lista "Errores típicos de la IA" si apareció un patrón nuevo.
4. Si un mismo error apareció 2+ veces → proponer el cambio concreto a la skill correspondiente (y hacerlo si el usuario acepta).

## Reglas

- Primera persona del usuario ("pedí", "corregí"), no de la IA.
- Nada de relleno ni autoelogio: hechos verificables.
- No inventar tiempos: si no se sabe, preguntar o poner "s/d".
- Una sesión = una entrada, aunque haya tocado varias features.
