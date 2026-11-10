# 07 — Uso de IA, skills y evidencia

La consigna evalúa **criterio** en el uso de IA: usarla intensivamente pero sabiendo cuándo corregirla. Este plan define cómo se trabaja y qué queda registrado.

## Herramientas

| Herramienta | Uso principal | Gratis |
|---|---|---|
| Claude Code (VS Code) | Agente principal: planificación, back, front, tests | plan del usuario |
| Skills del proyecto (`.claude/skills/`) | Estandarizar cómo la IA hace cada tipo de tarea | sí |
| Skills externas: `expo/skills`, `callstackincubator/agent-skills` (`react-native-best-practices`) | Conocimiento actualizado de Expo/RN | sí |
| superpowers (brainstorming, writing-plans, TDD, verification) | Proceso | sí |
| Opcional para comparar: v0 / Google Antigravity / Copilot free | Prototipar 1 pantalla y comparar con Claude Code | sí |

Instalación de skills externas (una vez, en Claude Code):

```
/plugin install expo@claude-plugins-official     # según docs.expo.dev/skills
# alternativa: /plugin marketplace add expo/skills  y elegir el plugin desde /plugin
npx skills add callstackincubator/agent-skills --skill react-native-best-practices
```

Leer el `SKILL.md` de cada skill externa antes de instalarla (son instrucciones que la IA va a seguir).

## Skills del proyecto

| Skill | Cuándo | Salida |
|---|---|---|
| `escribir-spec` | inicio de cada feature | `specs/NN-<feature>.md` aprobada |
| `modelar-dominio` | clases/reglas | clase + test unitario |
| `crear-endpoint` | endpoint nuevo | ruta→controller→service→repo + zod + swagger + tests |
| `crear-pantalla` | pantalla nueva | pantalla + api + test RNTL + checklist |
| `sistema-diseno` | tema/componentes | tokens y componentes consistentes |
| `tiempo-real-socket` | chat | server + cliente socket |
| `escribir-tests` | cualquier test | tests siguiendo `planes/05` |
| `cerrar-feature` | fin de feature | DoD verificada + commit sugerido |
| `bitacora-ia` | fin de sesión | entrada en bitácora |

Subagentes: `revisor-reglas-negocio` (auditoría de reglas, solo lectura) y `qa-mobile` (tests + checklist).

## Flujo de trabajo con IA por feature

1. **Spec** (`escribir-spec`): la IA propone, yo valido reglas. Registrar qué preguntas hizo y qué decidí.
2. **Plan** (si la feature es grande): `superpowers:writing-plans`.
3. **TDD**: tests primero (`escribir-tests`), después implementación con la skill específica.
4. **Revisión**: leer el diff completo; `/code-review` o `revisor-reglas-negocio`.
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
