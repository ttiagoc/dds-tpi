import { Router } from "express";
import { EventoController } from "../controllers/EventoController.js";
import { CompraController } from "../controllers/CompraController.js";
import { autorizar } from "../middlewares/autorizar.js";
import { validate } from "../middlewares/validate.js";
import { crearEventoValidation } from "../validations/crearEventoValidation.js";
import { Rol } from "../domain/Rol.js";

export function crearEventoRoutes(
  { eventoService, compraService },
  { autenticar, autenticarOpcional },
) {
  const router = Router();
  const controller = new EventoController(eventoService);
  const compraController = new CompraController(compraService);
  const organizador = [autenticar, autorizar(Rol.ORGANIZADOR)];
  router.get("/", autenticarOpcional, controller.buscar);
  router.get("/:id", autenticarOpcional, controller.obtener);
  router.get("/:id/compras", ...organizador, compraController.listarDelEvento);
  router.post("/", ...organizador, validate(crearEventoValidation), controller.crear);
  return router;
}
