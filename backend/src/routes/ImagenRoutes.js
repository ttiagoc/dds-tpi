import { Router } from "express";
import { ImagenController } from "../controllers/ImagenController.js";
import { autorizar } from "../middlewares/autorizar.js";
import { crearSubidaDeImagen } from "../middlewares/subirImagen.js";
import { Rol } from "../domain/Rol.js";

export function crearImagenRoutes({ autenticar }, { carpetaImagenes }) {
  const router = Router();
  const controller = new ImagenController();
  router.post(
    "/",
    autenticar,
    autorizar(Rol.ORGANIZADOR),
    crearSubidaDeImagen(carpetaImagenes),
    controller.subir,
  );
  return router;
}
