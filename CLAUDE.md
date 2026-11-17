# CLAUDE.md

@AGENTS.md

## Cómo trabajar en este repo (Claude Code)

Respondé en castellano rioplatense. Antes de escribir código, usá la skill que corresponda. Las skills de una carpeta se cargan cuando trabajás en esa carpeta: si todavía no aparecen, abrí primero un archivo de ahí.

| Situación | Skill | Carpeta |
|---|---|---|
| Arranca una feature nueva | `escribir-spec` (y después `superpowers:writing-plans` si es grande) | raíz |
| Clase o regla de dominio | `modelar-dominio` | `backend/` |
| Endpoint nuevo o cambio de contrato | `crear-endpoint` | `backend/` |
| Pantalla nueva o cambios de UI | `crear-pantalla` (+ `sistema-diseno` si hace falta un componente nuevo) | `frontend/` |
| Colores, tema, componente compartido | `sistema-diseno` | `frontend/` |
| Chat / Socket.io | `tiempo-real-socket` | raíz |
| Tests | `escribir-tests` (una por parte: back, front, e2e) | `backend/`, `frontend/`, `e2e/` |
| Revisar repetición, capas y modularización | `revisar-calidad` | raíz |
| Terminar una feature / commitear | `cerrar-feature` (incluye `revisar-calidad`) | raíz |
| Fin de sesión | `bitacora-ia` | raíz |

Para APIs de Expo / React Native usar además las skills de los plugins `expo`, `building-react-native-apps` y `testing-react-native-apps`.

gstack: solo las skills y momentos de la tabla "gstack: uso selectivo" de `planes/07-ia-skills-y-evidencia.md`. Nunca `/ship` ni `/land-and-deploy`.

Subagentes del proyecto: `revisor-reglas-negocio` (verifica código contra `planes/02-dominio.md`) y `qa-mobile` (corre tests y checklist de pantallas).

## Explorar el código: CodeGraph

El repo está indexado con CodeGraph (`.codegraph/`, local y fuera de git; se mantiene solo mientras corre el MCP). Para ubicar o entender código, usarlo **antes** de grep o de leer archivos:

- MCP: `codegraph_explore` devuelve en una llamada el código de los símbolos relevantes y los caminos de llamadas entre ellos.
- Nombrar símbolos (`CompraController.cancelar`, `Compra.cancelar`) en vez de preguntar en lenguaje natural: palabras genéricas como "compra" traen ruido del front.
- Shell: `codegraph explore "<símbolos o pregunta>"` da la misma salida (sirve en subagentes).

Si no existe `.codegraph/`, ignorar esta sección (se crea con `codegraph init --local-only`).

## Comandos

```bash
# back
cd backend && npm run dev        # API en :3000 + seed
cd backend && npm test           # unit + integración
# front
cd frontend && npx expo start    # QR para Expo Go
cd frontend && npx expo start --web
cd frontend && npm test
# calidad (raíz): eslint + duplicados
npm run calidad
# e2e: terminal 1 levanta back (NODE_ENV=test) + web; terminal 2 corre Cypress
npm run e2e:servidores
npm run e2e
```

## Reglas para Claude

- No commitear ni mergear sin que el usuario lo pida; al cerrar sugerí el mensaje de commit.
- Si el pedido contradice un plan, señalalo y proponé actualizar el plan antes de codear.
- Cuando generes algo que el usuario tuvo que corregir, anotalo en la bitácora (es material para la conclusión del video).
- Contexto de referencia (solo lectura): repo de cátedra `ddso-utn/ejercicio-megasuper-2026` (ramas `clase12-DockerYDeploy`, `clase11-integracion-front-back`) y TP grupal en `../2026-2c-lu-sa-grupo-11` (rama `develop`).
