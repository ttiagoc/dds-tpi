# ADR-013 — Imágenes de eventos subidas al back

- **Fecha:** 2026-11-19
- **Estado:** aceptada

## Contexto

Para crear un evento había que pegar la URL de una imagen, algo poco práctico desde el celular. Las imágenes del seed ya las sirve Express desde `backend/public/imagenes` (spec 17); no había ningún servicio externo de almacenamiento.

## Opciones

1. **Subir al back**: `multer` guarda el archivo en `public/imagenes/subidas/` y se sirve con el mismo `express.static`.
2. **Servicio en la nube gratuito** (Cloudinary): almacenamiento persistente y CDN, pero exige cuenta, API key en `.env` y una dependencia externa para la demo.
3. **Dejar la URL**.

## Decisión

Opción 1. Es coherente con la persistencia en memoria (ADR-003): los datos tampoco sobreviven a un reinicio, así que no hace falta que las imágenes sí. No suma cuentas ni secretos. Se valida tipo (JPG, PNG, WEBP) y tamaño (5 MB) y se guarda con nombre aleatorio.

## Consecuencias

- Las subidas se pierden en cada redeploy, igual que los eventos que las usan.
- La carpeta `subidas/` se ignora en git y la imagen Docker la crea con permisos para el usuario `node`.
- Pasar a un servicio externo solo cambia dónde guarda el endpoint: el contrato (`{ url }`) y el front quedan igual.

## Rol de la IA

La IA aclaró que las imágenes no estaban en un servicio externo y propuso subirlas al back; el usuario eligió esta opción frente a Cloudinary.
