import { Router } from "express";
import { EventoController } from "../controllers/EventoController.js";
import { autorizar } from "../middlewares/autorizar.js";
import { Rol } from "../domain/Rol.js";

export function crearOrganizadorRoutes({ eventoService }, { autenticar }) {
  const router = Router();
  const controller = new EventoController(eventoService);
  router.get(
    "/yo/eventos",
    autenticar,
    autorizar(Rol.ORGANIZADOR),
    controller.listarDelOrganizador,
  );
  return router;
}
