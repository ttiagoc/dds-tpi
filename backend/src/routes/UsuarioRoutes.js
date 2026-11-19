import { Router } from "express";
import { FavoritoController } from "../controllers/FavoritoController.js";
import { MensajeController } from "../controllers/MensajeController.js";
import { autorizar } from "../middlewares/autorizar.js";
import { Rol } from "../domain/Rol.js";

export function crearUsuarioRoutes({ favoritoService, mensajeService }, { autenticar }) {
  const router = Router();
  const controller = new FavoritoController(favoritoService);
  const mensajeController = new MensajeController(mensajeService);
  const comprador = [autenticar, autorizar(Rol.COMPRADOR)];
  router.get("/yo/favoritos", ...comprador, controller.listar);
  router.put("/yo/favoritos/:eventoId", ...comprador, controller.agregar);
  router.delete("/yo/favoritos/:eventoId", ...comprador, controller.quitar);
  router.get("/yo/conversaciones", autenticar, mensajeController.listarConversaciones);
  return router;
}
