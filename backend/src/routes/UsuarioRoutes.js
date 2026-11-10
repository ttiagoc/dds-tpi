import { Router } from "express";
import { FavoritoController } from "../controllers/FavoritoController.js";
import { autorizar } from "../middlewares/autorizar.js";
import { Rol } from "../domain/Rol.js";

export function crearUsuarioRoutes({ favoritoService }, { autenticar }) {
  const router = Router();
  const controller = new FavoritoController(favoritoService);
  const comprador = [autenticar, autorizar(Rol.COMPRADOR)];
  router.get("/yo/favoritos", ...comprador, controller.listar);
  router.put("/yo/favoritos/:eventoId", ...comprador, controller.agregar);
  router.delete("/yo/favoritos/:eventoId", ...comprador, controller.quitar);
  return router;
}
