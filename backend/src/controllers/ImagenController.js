import { BadRequestError } from "../errors/AppError.js";
import { CARPETA_SUBIDAS } from "../middlewares/subirImagen.js";

export const MENSAJE_FALTA_IMAGEN = "Falta la imagen";

export class ImagenController {
  subir = (req, res, next) => {
    if (!req.file) return next(new BadRequestError(MENSAJE_FALTA_IMAGEN));
    return res.status(201).json({ url: `/imagenes/${CARPETA_SUBIDAS}/${req.file.filename}` });
  };
}
