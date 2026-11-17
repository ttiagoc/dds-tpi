# Checklist de endpoint

## Contrato
- [ ] Coincide exactamente con `planes/03-api-contratos.md` (ruta, método, forma de respuesta, errores).
- [ ] Respuesta sin wrapper; listas como `{ <recursos>, total, page, totalPages }`.
- [ ] Nunca expone `passwordHash` ni datos de otros usuarios que no correspondan.

## Capas
- [ ] Controller sin reglas de negocio; try/catch con `next(error)`.
- [ ] Permisos de rol en la ruta (`autorizar`), permisos de recurso en el service.
- [ ] Reglas en el dominio; el service no modifica `estado` ni `vendidas` a mano.
- [ ] Momento actual desde `reloj`, no `new Date()` suelto.
- [ ] Validación zod `.strict()` con mensajes en castellano.

## Errores
- [ ] 400 / 401 / 403 / 404 / 409 / 422 según la tabla de la skill.
- [ ] Mensajes en voseo y entendibles para el usuario final.

## Calidad
- [ ] Tests de service (feliz + cada error) y de integración (feliz + errores principales).
- [ ] `npm test` en verde.
- [ ] Swagger actualizado y probado en `/api-docs`.
- [ ] Sin `console.log` ni código comentado.
