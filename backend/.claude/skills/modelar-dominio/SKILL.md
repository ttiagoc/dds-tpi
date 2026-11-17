---
name: modelar-dominio
description: Usar al crear o modificar clases de dominio del backend de AI Ticket It (Usuario, Evento, TipoEntrada, Compra, Resenia, enums) o cualquier regla de negocio. Fuerza test unitario primero, validación en constructor y reglas dentro de las entidades.
---

# Modelar dominio

El dominio vive en `backend/src/domain/`, no conoce Express ni repositorios, y es donde están las reglas de negocio. Fuente: `planes/02-dominio.md`.

## Pasos

1. Leer la sección de la clase en `planes/02-dominio.md` y la spec activa. Si la regla no está escrita → preguntar, no inventar.
2. **Test primero** en `backend/test/domain/<Clase>.test.js` (ver skill `escribir-tests`):
   - constructor válido,
   - cada validación del constructor tira `UnprocessableEntityError`,
   - cada método con caso feliz + bordes listados en el plan.
3. Correr el test y verlo fallar.
4. Implementar la clase.
5. Agregar/actualizar factory en `backend/test/helpers/domainFactories.js` (`crearX(overrides = {})`).
6. Correr toda la suite.

## Plantilla

```js
import { UnprocessableEntityError } from "../errors/AppError.js";

export class TipoEntrada {
  constructor({ id = null, nombre, descripcion = "", precio, cupo, vendidas = 0 }) {
    if (!nombre?.trim()) throw new UnprocessableEntityError("El tipo de entrada necesita un nombre");
    if (!(precio >= 0)) throw new UnprocessableEntityError("El precio no puede ser negativo");
    if (!Number.isInteger(cupo) || cupo < 1) throw new UnprocessableEntityError("El cupo tiene que ser al menos 1");
    Object.assign(this, { id, nombre: nombre.trim(), descripcion, precio, cupo, vendidas });
  }

  disponibles() {
    return this.cupo - this.vendidas;
  }

  hayCupoPara(cantidad) {
    return Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= this.disponibles();
  }

  reservar(cantidad) {
    if (!this.hayCupoPara(cantidad)) {
      throw new UnprocessableEntityError(`No hay cupo suficiente para ${this.nombre}`);
    }
    this.vendidas += cantidad;
  }
}
```

Enums en archivo propio:

```js
export const EstadoCompra = Object.freeze({
  PENDIENTE: "PENDIENTE",
  CONFIRMADA: "CONFIRMADA",
  UTILIZADA: "UTILIZADA",
  CANCELADA: "CANCELADA",
  REEMBOLSADA: "REEMBOLSADA",
});
```

## Reglas

- **Comportamiento en la entidad**, no en el service: el service orquesta (busca, chequea permisos, guarda); la entidad decide (`compra.cancelar(quien, ahora)`).
- Nada de `new Date()` dentro del dominio: el momento actual entra por parámetro (`ahora`), viene del `reloj` inyectado.
- Errores de regla de negocio → `UnprocessableEntityError` con mensaje en voseo para el usuario final.
- Sin getters/setters triviales; campos públicos simples.
- Transiciones de estado solo vía `actualizarEstado` + `TRANSICIONES`; nunca `compra.estado = ...` fuera de la clase.
- Si cambia el modelo respecto al diagrama de la consigna, marcarlo con (Δ) en `planes/02-dominio.md` y justificar.
