# Spec NN — Nombre de la feature

- **Estado:** borrador | aprobada | implementada
- **Rama:** `feature/<nombre>`
- **Casos de uso:** CUx, CUy (ver `planes/00-indice.md`)
- **Iteración:** ItN

## Contexto
Por qué existe la feature y qué problema resuelve para el usuario.

## Historias
- Como <rol>, quiero <acción> para <beneficio>.

## Reglas de negocio
Referenciar `planes/02-dominio.md` (R1, R2…) y agregar las nuevas acá. Si se agrega una regla, actualizar el plan.

## Contrato de API
Endpoints involucrados (deben existir en `planes/03-api-contratos.md`): método, ruta, body, respuesta, errores.

## Pantallas
Pantallas afectadas (`planes/04-frontend-pantallas.md`), estados, testIDs.

## Criterios de aceptación
```gherkin
Escenario: <caso feliz>
  Dado ...
  Cuando ...
  Entonces ...

Escenario: <caso de error>
  Dado ...
  Cuando ...
  Entonces ...
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit dominio | |
| Unit service | |
| Integración | |
| Front (RNTL) | |
| E2E | |

## Fuera de alcance
Lo que explícitamente no se hace.

## Notas de IA
Qué propuso la IA, qué se cambió.
