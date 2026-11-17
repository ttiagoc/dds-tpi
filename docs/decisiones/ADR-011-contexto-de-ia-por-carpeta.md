# ADR-011 — Contexto de IA por carpeta y CodeGraph

- **Fecha:** 2026-11-17
- **Estado:** aceptada

## Contexto
Todas las skills del proyecto estaban en `.claude/skills/` y el `AGENTS.md` raíz tenía las reglas del back y del front juntas: una sesión que solo tocaba el back igual veía skills y reglas del front, y al revés. `frontend/AGENTS.md` solo se leía porque `CLAUDE.md` lo nombraba, ya que Claude Code lee `CLAUDE.md` y no `AGENTS.md`. Además, plugins sin uso en el proyecto (Postman, Canva) sumaban decenas de herramientas y skills a cada sesión, y para ubicar código el agente dependía de grep y de leer archivos enteros.

## Opciones
1. **Skills y reglas por carpeta**: skills propias en `backend/`, `frontend/` y `e2e/.claude/skills/`; un `AGENTS.md` por parte importado por un `CLAUDE.md` de una línea. Claude Code los carga al trabajar en esa carpeta y otros agentes (Cursor, Copilot, Codex) leen los `AGENTS.md` anidados.
2. **Un `RULES.md` por carpeta**: ninguna herramienta lo lee por convención; habría que importarlo a mano en cada `CLAUDE.md`.
3. **Reglas condicionales en `.claude/rules/` con `paths`**: solo las entiende Claude Code.

## Decisión
Opción 1. Quedan en la raíz las skills transversales (`escribir-spec`, `revisar-calidad`, `cerrar-feature`, `bitacora-ia`, `tiempo-real-socket`, que toca back y front) y los subagentes. `crear-endpoint` y `modelar-dominio` van a `backend/`; `crear-pantalla` y `sistema-diseno` a `frontend/`; `escribir-tests` se parte en tres (back, front, e2e). Postman y Canva se apagan en `.claude/settings.json` del proyecto; gstack se mantiene por su uso selectivo (plan 07).

Se agrega CodeGraph (MCP `codegraph`, el más usado para Claude Code) en `.mcp.json` del proyecto, con el índice en `.codegraph/` fuera de git. No se instala su hook de prompt: inyectaba código en cada mensaje, lo opuesto a lo que se busca.

## Consecuencias
- Las skills de una carpeta no aparecen hasta que la sesión toca un archivo de esa carpeta; la tabla de `CLAUDE.md` indica la carpeta de cada una.
- Cada colaborador necesita la CLI (`npm i -g @colbymchenry/codegraph`) y correr `codegraph init --local-only` una vez; sin `.codegraph/` el agente ignora la sección.
- CodeGraph manda telemetría anónima por defecto (`codegraph telemetry off` la apaga).

## Rol de la IA
La IA hizo el diagnóstico (el ahorro de mover skills es chico porque solo se cargan sus descripciones; el peso real estaba en los plugins), propuso `AGENTS.md` en lugar de `RULES.md` y descartó el hook de CodeGraph tras probar su salida. El usuario eligió qué plugins apagar y mantener gstack.
