# ADR-004 — Autenticación JWT con usuarios sembrados

- **Fecha:** 2026-11-10
- **Estado:** aceptada

## Contexto
Hay dos roles (comprador, organizador) con permisos distintos. No hay caso de uso de registro.

## Opciones
1. **Login JWT con usuarios seed** — realista, reutiliza el patrón del TP grupal.
2. Selector de usuario + header `x-user-id` — rápido pero sin seguridad.
3. Registro + login completo — trabajo fuera de alcance.

## Decisión
`POST /auth/login` (bcrypt + JWT HS256, `sub` = id, `rol` en payload). Un rol por usuario. Middlewares `autenticar` y `autorizar(...roles)`; permisos de recurso en services. Sesión en `expo-secure-store` (nativo) / `localStorage` (web).

## Consecuencias
- Socket.io usa el mismo token en el handshake.
- Registro queda como mejora futura.

## Rol de la IA
Opción recomendada por la IA y aceptada.
