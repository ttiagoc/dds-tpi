import { Router } from "express";
import { EventoController } from "../controllers/EventoController.js";
import { ReseniaController } from "../controllers/ReseniaController.js";
import { autorizar } from "../middlewares/autorizar.js";
import { Rol } from "../domain/Rol.js";

export function crearOrganizadorRoutes({ eventoService, reseniaService }, { autenticar }) {
  const router = Router();
  const controller = new EventoController(eventoService);
  const reseniaController = new ReseniaController(reseniaService);
  router.get("/:id/resenias", reseniaController.listarDelOrganizador);
  router.get(
    "/yo/eventos",
    autenticar,
    autorizar(Rol.ORGANIZADOR),
    controller.listarDelOrganizador,
  );
  return router;
}
