import { Router } from "express";
import { DireccionController } from "../controllers/DireccionController.js";
import { autorizar } from "../middlewares/autorizar.js";
import { Rol } from "../domain/Rol.js";

export function crearDireccionRoutes({ direccionService }, { autenticar }) {
  const router = Router();
  const controller = new DireccionController(direccionService);
  router.get("/ubicacion", autenticar, autorizar(Rol.ORGANIZADOR), controller.ubicacion);
  return router;
}
