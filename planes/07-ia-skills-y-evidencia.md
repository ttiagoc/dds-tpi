# 07 — Uso de IA, skills y evidencia

La consigna evalúa **criterio** en el uso de IA: usarla intensivamente pero sabiendo cuándo corregirla. Este plan define cómo se trabaja y qué queda registrado.

## Herramientas

| Herramienta | Uso principal | Gratis |
|---|---|---|
| Claude Code (VS Code) | Agente principal: planificación, back, front, tests | plan del usuario |
| Skills del proyecto (`.claude/skills/` transversales; `backend/`, `frontend/` y `e2e/.claude/skills/` por parte) | Estandarizar cómo la IA hace cada tipo de tarea | sí |
| CodeGraph (MCP `codegraph`, `.mcp.json`) | Índice local del código (símbolos y llamadas) para ubicar código sin grep ni lecturas de archivos enteros | sí |
| Skills externas (plugins habilitados en `.claude/settings.json`): `expo` (oficial de Expo), `building-react-native-apps` y `testing-react-native-apps` (Callstack) | Conocimiento actualizado de Expo SDK 58, buenas prácticas y testing de React Native | sí |
| superpowers (brainstorming, writing-plans, TDD, verification) | Proceso | sí |
| Opcional para comparar: v0 / Google Antigravity / Copilot free | Prototipar 1 pantalla y comparar con Claude Code | sí |

Antes de incorporar una skill externa se revisa su `SKILL.md`, porque sus instrucciones condicionan el comportamiento del agente.

## Skills del proyecto

| Skill | Carpeta | Cuándo | Salida |
|---|---|---|---|
| `escribir-spec` | raíz | inicio de cada feature | `specs/NN-<feature>.md` aprobada |
| `modelar-dominio` | `backend/` | clases/reglas | clase + test unitario |
| `crear-endpoint` | `backend/` | endpoint nuevo | ruta→controller→service→repo + zod + swagger + tests |
| `crear-pantalla` | `frontend/` | pantalla nueva | pantalla + api + test RNTL + checklist |
| `sistema-diseno` | `frontend/` | tema/componentes | tokens y componentes consistentes |
| `tiempo-real-socket` | raíz | chat | server + cliente socket |
| `escribir-tests` | `backend/`, `frontend/`, `e2e/` (una por parte) | cualquier test | tests siguiendo `planes/05` |
| `revisar-calidad` | raíz | cierre de cada rama | hallazgos de repetición, capas y modularización |
| `cerrar-feature` | raíz | fin de feature | DoD verificada + commit sugerido |
| `bitacora-ia` | raíz | fin de sesión | entrada en bitácora |

Las skills de una carpeta solo se cargan cuando el agente trabaja sobre archivos de esa carpeta, y lo mismo pasa con su `AGENTS.md` (importado por un `CLAUDE.md` de una línea). Así una sesión del back no carga las reglas del front y viceversa (ADR-011).

Subagentes: `revisor-reglas-negocio` (auditoría de reglas, solo lectura) y `qa-mobile` (tests + checklist).

## gstack: uso selectivo

gstack se usa como herramienta de revisión y QA en momentos puntuales, no como método de desarrollo general: el flujo principal lo definen las skills del proyecto, y varias skills de gstack asumen un proceso (PRs, versionado, deploy) que este proyecto no tiene.

| Momento | Skill | Propósito |
|---|---|---|
| Antes de It1 y de It4 | `/plan-eng-review` | Revisión crítica de arquitectura y planes |
| Bug no trivial | `/investigate` | Análisis de causa raíz antes de corregir |
| Antes de mergear una feature con lógica de negocio | `/review` | Revisión del diff, complementaria a `revisor-reglas-negocio` |
| Fin de It2 | `/cso` | Auditoría de seguridad de autenticación y permisos |
| Cierre de pantallas, It4-It5 | `/qa`, `/qa-only`, `/browse` | Recorrido de la app en Expo Web con navegador real |
| Pulido de UI, It5 | `/design-review` | Revisión visual de consistencia y jerarquía |

No se usan: `/ship`, `/land-and-deploy`, `/setup-deploy`, `/canary`, `/benchmark`, `ios-*`.

## Flujo de trabajo con IA por feature

1. **Spec** (`escribir-spec`): la IA propone, yo valido reglas. Registrar qué preguntas hizo y qué decidí.
2. **Plan** (si la feature es grande): `superpowers:writing-plans`.
3. **TDD**: tests primero (`escribir-tests`), después implementación con la skill específica.
4. **Revisión**: `revisar-calidad` siempre (repetición, capas, modularización; `npm run calidad` = eslint + jscpd); `revisor-reglas-negocio` o `/code-review` si hay lógica de negocio.
5. **Verificación**: correr tests, probar en Expo Go.
6. **Cierre** (`cerrar-feature`) + **bitácora** (`bitacora-ia`).

## Qué registrar (insumo para la conclusión del video)

En `docs/ia/bitacora.md`, por sesión:
- Objetivo, skill/herramienta, prompt resumido.
- Qué generó bien a la primera.
- Qué tuve que corregir y **por qué** (alucinó API, ignoró una regla, sobre-ingeniería, estilo inconsistente, versión vieja de una librería).
- Tiempo aproximado ahorrado o perdido.
- Aprendizaje (tecnología nueva entendida, o regla para una skill).

Cuando una corrección se repite → mejorar la skill correspondiente y anotarlo (muestra iteración sobre el proceso).

## Métricas para la conclusión

- Cantidad de sesiones, features y % de código generado vs escrito/corregido a mano (estimado).
- Top 5 errores típicos de la IA en este proyecto.
- Momentos donde la IA aceleró mucho (scaffolding, tests, swagger) vs donde frenó (configuración Expo/red, versiones).
- Ventajas, desventajas, dificultades, aprendizajes, valoración personal (lo que pide la consigna).
