# ADR-010 — Imagen Docker del back

- **Fecha:** 2026-11-14
- **Estado:** aceptada

## Contexto
It5 pide empaquetar el back en Docker (spec 14). La referencia de la cátedra (clase 12) y el TP grupal usan `node:20-alpine`, y el grupal suma un compose con Mongo. Este back persiste en memoria, no tiene paso de build y sus dependencias son JavaScript puro (`bcryptjs`).

## Opciones
1. **`node:24-alpine`, imagen de una etapa, sin compose**: misma versión mayor LTS con la que corren los tests; imagen chica.
2. **`node:20-alpine` como la cátedra**: misma base que el material de clase, pero Node 20 está fuera de soporte desde abril de 2026 y difiere de la versión de desarrollo.
3. **Agregar `docker-compose`**: un solo comando con variables declaradas, pero no hay otros servicios que orquestar.

## Decisión
Opción 1. `NODE_ENV=production` por defecto, `npm ci --omit=dev`, solo `src/` en la imagen, `USER node`, `HEALTHCHECK` contra `GET /healthcheck` con `fetch` de Node (sin instalar curl) y `CMD ["node", "src/server.js"]` para que `docker stop` llegue al proceso. Sin compose.

## Consecuencias
- El secreto se pasa al correr (`-e JWT_SECRET` o `--env-file`); sin él la imagen no arranca, por la validación existente de `config/entorno.js`.
- Con `-e NODE_ENV=test` la misma imagen habilita `/test/reset` y sirve para correr los flujos e2e.
- Si se agrega una base de datos, ahí sí corresponde un compose.

## Rol de la IA
La IA comparó las dos referencias, señaló el fin de soporte de Node 20 y propuso las opciones; el usuario eligió Node 24, sin compose y con usuario no root más healthcheck.
