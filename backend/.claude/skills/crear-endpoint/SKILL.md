---
name: crear-endpoint
description: Usar al agregar o modificar un endpoint REST del backend de AI Ticket It (Express 5). Recorre contrato → validación zod → route → controller → service → repositorio → Swagger → tests, siguiendo las convenciones de la cátedra y del TP grupal.
---

# Crear endpoint

Ver `checklist.md` en esta carpeta al terminar.

## 0. Contrato

- El endpoint tiene que estar en `planes/03-api-contratos.md` (método, ruta, auth, body, respuesta, errores). **Si no está o no coincide con lo pedido: frenar**, proponer el cambio al plan y esperar OK.
- Releer reglas de `planes/02-dominio.md` que aplican.

## 1. Tests primero

- Service: `backend/test/services/<Recurso>Service.test.js` con repos fake (`{ findById: jest.fn().mockResolvedValue(x) }`) y reloj fijo. Un test por regla/permiso/error.
- Integración: `backend/test/integration/<recurso>.test.js` con supertest sobre `crearApp(contenedor)` y seed mínimo. Caso feliz + 400 + 401/403 + 404 + 422 que apliquen.

## 2. Implementación (de adentro hacia afuera)

1. **Dominio**: si hay regla nueva, usar skill `modelar-dominio`.
2. **Repositorio** (`src/repositories/<Recurso>Repository.js`, extiende `InMemoryRepository`): métodos async de consulta específicos (`findByComprador(id)`, `buscar(filtros)`). Filtrado/orden/paginado en el repo.
3. **Validación** (`src/validations/<recurso>Validation.js`): zod `.strict()`. Query con `z.coerce`. Mensajes en castellano.
   ```js
   export const crearCompraValidation = z
     .object({
       eventoId: z.number().int().positive(),
       tipoEntradaId: z.number().int().positive(),
       cantidad: z.number().int().min(1, "La cantidad mínima es 1"),
     })
     .strict();
   ```
4. **Service** (`src/services/<Recurso>Service.js`): DI por constructor con defaults; busca entidades (404 `NotFoundError`), chequea permisos de recurso (403 `ForbiddenError`), delega la regla en el dominio, guarda, emite eventos (notificador) si corresponde, devuelve `this.toResponse(entidad, usuario)`.
5. **Controller** (`src/controllers/<Recurso>Controller.js`, `extends BaseController`):
   ```js
   cancelar = async (req, res, next) => {
     try {
       const id = this.parsearId(req.params.id);
       const compra = await this.compraService.cancelar(id, req.usuario);
       return res.status(200).json(compra);
     } catch (error) {
       return next(error);
     }
   };
   ```
   Solo parsea entrada, llama al service y elige status. Sin reglas de negocio.
6. **Route** (`src/routes/<Recurso>Routes.js`):
   ```js
   router.post("/:id/cancelacion", autenticar, autorizar(Rol.COMPRADOR), (req, res, next) =>
     compraController.cancelar(req, res, next),
   );
   ```
   Montar en `src/routes/router.js` si es recurso nuevo.
7. **Swagger** (`src/docs/openapi/<modulo>.js`): path con parámetros, body, respuestas y errores usando helpers de `comun.js` (`ok`, `error`, `body`, `idPath`, `paginado`). Marcar `security` si requiere auth.

## 3. Verificar

```bash
cd backend && npm test
```

Probar a mano en `/api-docs` con un token de usuario seed. Repasar `checklist.md`.

## Status codes

| Caso                              | Código | Error                      |
| --------------------------------- | ------ | -------------------------- |
| Lectura / acción ok               | 200    |                            |
| Creación                          | 201    |                            |
| Sin contenido (favoritos, reset)  | 204    |                            |
| Body/query/params inválidos (zod) | 400    | `BadRequestError`          |
| Sin token o token inválido        | 401    | `UnauthorizedError`        |
| Rol o recurso ajeno               | 403    | `ForbiddenError`           |
| No existe                         | 404    | `NotFoundError`            |
| Duplicado (reseña ya hecha)       | 409    | `ConflictError`            |
| Regla de negocio                  | 422    | `UnprocessableEntityError` |
