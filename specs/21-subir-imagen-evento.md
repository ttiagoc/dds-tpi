# Spec 21 — Subir la foto del evento desde el celular

- **Estado:** aprobada
- **Rama:** `feature/subir-imagen-evento`
- **Casos de uso:** CU4 (ver `planes/00-indice.md`)
- **Iteración:** It5b (rediseño)
- **Depende de:** spec 11b (crear evento), spec 17 (imágenes servidas por el back en `/imagenes`)

## Contexto
Al crear un evento, el organizador tiene que pegar la URL de una imagen. En un celular eso casi nunca pasa: la foto está en la galería. Las imágenes del seed ya las sirve el back desde `backend/public/imagenes`; se agrega un endpoint para subir una foto ahí y el formulario la elige de la galería.

## Historias
- Como organizador, quiero elegir la portada del evento desde la galería y verla antes de publicar.

## Reglas de negocio
Sin reglas de dominio nuevas: `Evento.multimedia` sigue siendo una lista de URLs (R8 sin cambios). Reglas del endpoint:

- **RI1** Solo ORGANIZADOR. Un archivo por pedido en el campo `imagen`.
- **RI2** Formatos JPG, PNG o WEBP (por tipo MIME), hasta 5 MB.
- **RI3** Se guarda con nombre aleatorio (`<uuid>.<ext>`) en `public/imagenes/subidas/` y se sirve en `/imagenes/subidas/<archivo>`. Las subidas no se versionan (`.gitignore`) y, como los datos (ADR-003), no sobreviven a un redeploy (ADR-013).

## Contrato de API
| Método | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| POST | `/imagenes` | 🅞 | `multipart/form-data` campo `imagen` | 201 `{ url: "/imagenes/subidas/<uuid>.jpg" }` | 400 "Falta la imagen", 400 "La imagen tiene que ser JPG, PNG o WEBP", 413 "La imagen no puede pesar más de 5 MB", 401, 403 |

## Pantallas
- **CrearEvento**: el campo "URL de la imagen" se reemplaza por `SelectorImagen` (`evento-imagen`): sin foto, un recuadro punteado "Agregar foto de portada / Desde la galería · JPG, PNG o WEBP hasta 5 MB"; al tocarlo abre la galería (`expo-image-picker`, recorte 16:9) y sube la foto en el momento. Mientras sube: vista previa con indicador y "Publicar" deshabilitado. Con foto: vista previa 16:9 con "Cambiar" (`evento-imagen-cambiar`) y "Quitar" (`evento-imagen-quitar`). Error de subida: texto del back debajo (`evento-imagen-error`) y se puede reintentar. Sin permiso de galería: "Necesitamos acceso a tus fotos para elegir la portada". La foto es opcional, como antes.
- `api/imagenes.subirImagen(asset)` arma el `FormData` (en web usa `asset.file`; en el celular `{ uri, name, type }`).

## Criterios de aceptación
```gherkin
Escenario: subir una portada
  Dado que soy Fénix (organizador)
  Cuando subo una foto JPG de 1 MB a POST /imagenes
  Entonces recibo 201 con una url bajo /imagenes/subidas/ y GET a esa url devuelve la imagen

Escenario: formato inválido
  Cuando subo un PDF
  Entonces recibo 400 "La imagen tiene que ser JPG, PNG o WEBP"

Escenario: demasiado grande
  Cuando subo una imagen de 6 MB
  Entonces recibo 413 "La imagen no puede pesar más de 5 MB"

Escenario: comprador no puede subir
  Cuando Ana sube una imagen
  Entonces recibe 403

Escenario: crear evento con foto de la galería
  Dado que estoy en Nuevo evento
  Cuando elijo una foto y publico
  Entonces el evento se crea con esa foto y se ve en Explorar
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Integración | 201 + archivo servido; 400 sin archivo; 400 tipo; 413 tamaño; 401; 403 (supertest `.attach`, carpeta temporal) |
| Front (RNTL) | `SelectorImagen` con el picker mockeado: elegir, subiendo, vista previa, quitar, error, permiso denegado; CrearEvento manda `multimedia: [url]` |
| Manual | Expo Go: elegir de la galería y publicar |

## Fuera de alcance
- Varias imágenes por evento, sacar foto con la cámara, comprimir en el back.
- Borrar del disco las fotos que se subieron y no se usaron.
- Almacenamiento externo (Cloudinary, S3): descartado en ADR-013.

## Notas de IA
La IA aclaró que las imágenes no estaban en un servicio externo sino en el back, y propuso subirlas ahí en vez de usar un servicio en la nube para no sumar cuentas ni secretos. El usuario lo eligió.
