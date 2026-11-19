import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import multer from "multer";
import { AppError, BadRequestError } from "../errors/AppError.js";

export const CARPETA_SUBIDAS = "subidas";
export const TAMANIO_MAXIMO = 5 * 1024 * 1024;
export const MENSAJE_FORMATO_IMAGEN = "La imagen tiene que ser JPG, PNG o WEBP";
export const MENSAJE_IMAGEN_GRANDE = "La imagen no puede pesar más de 5 MB";

const EXTENSIONES = Object.freeze({
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
});

function traducirError(error) {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return new AppError(MENSAJE_IMAGEN_GRANDE, 413);
  }
  if (error instanceof multer.MulterError) return new BadRequestError(error.message);
  return error;
}

export function crearSubidaDeImagen(carpetaImagenes) {
  const destino = join(carpetaImagenes, CARPETA_SUBIDAS);
  mkdirSync(destino, { recursive: true });
  const subir = multer({
    storage: multer.diskStorage({
      destination: destino,
      filename: (_req, archivo, listo) =>
        listo(null, `${randomUUID()}.${EXTENSIONES[archivo.mimetype]}`),
    }),
    limits: { fileSize: TAMANIO_MAXIMO, files: 1 },
    fileFilter: (_req, archivo, listo) =>
      EXTENSIONES[archivo.mimetype]
        ? listo(null, true)
        : listo(new BadRequestError(MENSAJE_FORMATO_IMAGEN)),
  }).single("imagen");
  return (req, res, next) => subir(req, res, (error) => next(error && traducirError(error)));
}
