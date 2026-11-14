# Spec 14 — Imagen Docker del back

- **Estado:** implementada
- **Rama:** `chore/docker-back`
- **Casos de uso:** ninguno (infraestructura)
- **Iteración:** It5
- **Depende de:** `planes/01-arquitectura-y-convenciones.md` (`backend/Dockerfile`, `.dockerignore`), `GET /healthcheck`, `config/entorno.js` (sin `JWT_SECRET` y fuera de test, el back no arranca), spec 13 (flujos e2e)

## Contexto

El roadmap de It5 pide empaquetar el back en una imagen Docker, como en la clase 12 de la cátedra. El back es autocontenido (`backend/` con su `package-lock.json`), persiste en memoria y se siembra al arrancar, así que la imagen no necesita base de datos ni volúmenes. El README ya documenta `docker build ./backend` y `docker run --env-file`, pero los archivos no existen.

## Historias

- Como desarrollador, quiero construir y correr el back con Docker para levantarlo igual en cualquier máquina sin instalar Node.
- Como desarrollador, quiero correr los flujos e2e contra el back en un contenedor para comprobar que la imagen es la misma app.

## Reglas de negocio

No agrega reglas. Se apoya en las de entorno ya existentes:
- Fuera de `NODE_ENV=test`, sin `JWT_SECRET` el back no arranca ("Falta la variable de entorno JWT_SECRET").
- `POST /test/reset` solo existe con `NODE_ENV=test`.

## Contrato de API

Sin cambios. El `HEALTHCHECK` usa `GET /healthcheck` → 200 `{ status: "ok" }`.

## Archivos

| Archivo | Contenido |
|---|---|
| `backend/Dockerfile` | `FROM node:24-alpine` (misma major LTS que la PC; Node 20 de la cátedra está fuera de soporte desde abril de 2026). `ENV NODE_ENV=production`. `WORKDIR /app`. `COPY package*.json` + `npm ci --omit=dev` (capa cacheable). `COPY src ./src`. `USER node`. `EXPOSE 3000`. `HEALTHCHECK` con `node -e "fetch('http://localhost:3000/healthcheck')…"` (sin instalar curl). `CMD ["node", "src/server.js"]` (node directo para recibir las señales de `docker stop`). |
| `backend/.dockerignore` | `node_modules`, `coverage`, `test`, `.env`, `.env.*`, `*.log`, `Dockerfile`, `.dockerignore`. |
| `README.md` | Sección "Docker (solo back)": build, run con `--env-file backend/.env` (o `-e JWT_SECRET=…`), y cómo correr el e2e contra el contenedor (`-e NODE_ENV=test` + web aparte). |

Contexto de build: `./backend`. Sin `docker-compose` (no hay base que orquestar).

## Pantallas

Ninguna.

## Criterios de aceptación

```gherkin
Escenario: la imagen construye y el back responde
  Dado que se construye la imagen con "docker build -t ai-ticket-it-back ./backend"
  Cuando se corre con "-p 3000:3000 -e JWT_SECRET=<secreto>"
  Entonces GET /healthcheck responde 200 { status: "ok" }
  Y POST /auth/login con un usuario del seed responde 200 con token
  Y el contenedor queda "healthy"

Escenario: producción no expone el reset
  Dado el contenedor corriendo con la configuración por defecto
  Cuando se llama POST /test/reset
  Entonces responde 404

Escenario: sin secreto no arranca
  Dado que se corre la imagen sin JWT_SECRET
  Entonces el contenedor termina con error "Falta la variable de entorno JWT_SECRET"

Escenario: la imagen no corre como root ni lleva tests ni secretos
  Dado la imagen construida
  Entonces el proceso corre como el usuario "node"
  Y la imagen no contiene "test/", ".env" ni dependencias de desarrollo (jest)

Escenario: los flujos e2e pasan contra el contenedor
  Dado el contenedor corriendo con "-e NODE_ENV=test" en el puerto 3000
  Y la app web levantada con EXPO_PUBLIC_API_URL=http://localhost:3000
  Cuando se corre "npm run e2e"
  Entonces pasan los 3 flujos
```

## Plan de tests

| Nivel | Caso |
|---|---|
| Unit / integración | Sin cambios de código: `npm test` del back en verde como regresión |
| Smoke manual (Docker) | Escenarios 1 a 4 con `docker build`, `docker run`, `docker inspect` (health y usuario) y `docker run --rm … ls`/`whoami` |
| E2E | Escenario 5: `npm run e2e` 3/3 contra el contenedor |

## Fuera de alcance

- Imagen del front (Expo Go no se empaqueta; la web solo se usa para Cypress).
- `docker-compose`, registry, deploy a la nube, CI.
- Multi-stage (no hay build: el back es JS sin transpilar).

## Notas de IA

- La IA comparó con la cátedra (clase12: `node:20-alpine`, `npm ci --omit=dev`, `CMD node`) y el TP grupal (misma base + compose con Mongo), y señaló que Node 20 está fuera de soporte y que `bcryptjs` es JS puro (Alpine sin toolchain).
- Verificado: build ok (69 MB de contenido); `/healthcheck` 200, login 200 con token, contenedor `healthy`; `/test/reset` 404 en producción; sin `JWT_SECRET` termina con exit 1 y "Falta la variable de entorno JWT_SECRET"; `whoami` = `node`, `/app` solo con `node_modules`, `package*.json` y `src`, sin jest; e2e 3/3 contra el contenedor con `NODE_ENV=test` (incluido el chat por socket). Decisión registrada en ADR-010.
- Revisión de calidad: 2 hallazgos bajos; se aplicó la aclaración del README sobre `NODE_ENV=development` de `.env.example` al usar `--env-file`; levantar solo la web para el e2e contra el contenedor queda como receta manual.
- Decisiones del usuario: `node:24-alpine`; sin compose; usuario no root + `HEALTHCHECK` + `NODE_ENV=production` por defecto; verificación con smoke y e2e contra el contenedor.
