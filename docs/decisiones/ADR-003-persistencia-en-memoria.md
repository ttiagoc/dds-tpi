# ADR-003 — Persistencia en memoria con repositorios async

- **Fecha:** 2026-11-10
- **Estado:** aceptada

## Contexto
La consigna pide persistencia en memoria. Cátedra (clase12) usa repos en memoria síncronos; el TP grupal usa Mongoose (async).

## Decisión
Repositorios en memoria (`Map` + `nextId`) con **interfaz async** (`findById`, `save`, …) y una base `InMemoryRepository`. Se guardan instancias de dominio. Instancias singleton por proceso armadas en un contenedor.

## Consecuencias
- Services idénticos a si hubiera Mongo: migrar es cambiar repos.
- Los datos se pierden al reiniciar → seed al arrancar y `POST /test/reset` (solo `NODE_ENV=test`) para e2e.
- Sin transacciones: operaciones de un request son secuenciales en un solo hilo, no hay carreras reales (Node single-thread y sin `await` de I/O real entre leer y escribir el cupo).

## Rol de la IA
La IA propuso la interfaz async para mantener paridad con el TP grupal.
