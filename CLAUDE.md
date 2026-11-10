# CLAUDE.md

@AGENTS.md

## Cómo trabajar en este repo (Claude Code)

Respondé en castellano rioplatense. Antes de escribir código, usá la skill que corresponda:

| Situación | Skill |
|---|---|
| Arranca una feature nueva | `escribir-spec` (y después `superpowers:writing-plans` si es grande) |
| Clase o regla de dominio | `modelar-dominio` |
| Endpoint nuevo o cambio de contrato | `crear-endpoint` |
| Pantalla nueva o cambios de UI | `crear-pantalla` (+ `sistema-diseno` si hace falta un componente nuevo) |
| Colores, tema, componente compartido | `sistema-diseno` |
| Chat / Socket.io | `tiempo-real-socket` |
| Tests (unit, integración, RNTL, Cypress) | `escribir-tests` |
| Revisar repetición, capas y modularización | `revisar-calidad` |
| Terminar una feature / commitear | `cerrar-feature` (incluye `revisar-calidad`) |
| Fin de sesión | `bitacora-ia` |

Para APIs de Expo / React Native usar además las skills de los plugins `expo`, `building-react-native-apps` y `testing-react-native-apps`, y seguir `frontend/AGENTS.md` (Expo SDK 58: no confiar en conocimiento previo, instalar paquetes con `npx expo install`).

gstack: solo las skills y momentos de la tabla "gstack: uso selectivo" de `planes/07-ia-skills-y-evidencia.md`. Nunca `/ship` ni `/land-and-deploy`.

Subagentes del proyecto: `revisor-reglas-negocio` (verifica código contra `planes/02-dominio.md`) y `qa-mobile` (corre tests y checklist de pantallas).

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
# e2e (con back y web levantados)
npm run e2e
```

## Reglas para Claude

- No commitear ni mergear sin que el usuario lo pida; al cerrar sugerí el mensaje de commit.
- Si el pedido contradice un plan, señalalo y proponé actualizar el plan antes de codear.
- Cuando generes algo que el usuario tuvo que corregir, anotalo en la bitácora (es material para la conclusión del video).
- Contexto de referencia (solo lectura): repo de cátedra `ddso-utn/ejercicio-megasuper-2026` (ramas `clase12-DockerYDeploy`, `clase11-integracion-front-back`) y TP grupal en `../2026-2c-lu-sa-grupo-11` (rama `develop`).
