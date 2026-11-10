import { Router } from "express";
import { EventoController } from "../controllers/EventoController.js";
import { autorizar } from "../middlewares/autorizar.js";
import { validate } from "../middlewares/validate.js";
import { crearEventoValidation } from "../validations/crearEventoValidation.js";
import { Rol } from "../domain/Rol.js";

export function crearEventoRoutes({ eventoService }, { autenticar, autenticarOpcional }) {
  const router = Router();
  const controller = new EventoController(eventoService);
  router.get("/", autenticarOpcional, controller.buscar);
  router.get("/:id", autenticarOpcional, controller.obtener);
  router.post(
    "/",
    autenticar,
    autorizar(Rol.ORGANIZADOR),
    validate(crearEventoValidation),
    controller.crear,
  );
  return router;
}
