import { Router } from "express";
import { EventoController } from "../controllers/EventoController.js";

export function crearEventoRoutes({ eventoService }, { autenticarOpcional }) {
  const router = Router();
  const controller = new EventoController(eventoService);
  router.get("/", autenticarOpcional, controller.buscar);
  router.get("/:id", autenticarOpcional, controller.obtener);
  return router;
}
