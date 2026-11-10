import { Router } from "express";
import { CompraController } from "../controllers/CompraController.js";
import { autorizar } from "../middlewares/autorizar.js";
import { validate } from "../middlewares/validate.js";
import { ReseniaController } from "../controllers/ReseniaController.js";
import { crearCompraValidation } from "../validations/crearCompraValidation.js";
import { crearReseniaValidation } from "../validations/crearReseniaValidation.js";
import { Rol } from "../domain/Rol.js";

export function crearCompraRoutes({ compraService, reseniaService }, { autenticar }) {
  const router = Router();
  const controller = new CompraController(compraService);
  const reseniaController = new ReseniaController(reseniaService);
  const comprador = [autenticar, autorizar(Rol.COMPRADOR)];
  const organizador = [autenticar, autorizar(Rol.ORGANIZADOR)];
  router.post("/", ...comprador, validate(crearCompraValidation), controller.crear);
  router.get("/", ...comprador, controller.listarDelComprador);
  router.get("/:id", autenticar, controller.obtener);
  router.post("/:id/pago", ...comprador, controller.pagar);
  router.post("/:id/cancelacion", ...comprador, controller.cancelar);
  router.post("/:id/uso", ...organizador, controller.marcarUtilizada);
  router.post(
    "/:id/resenia",
    ...comprador,
    validate(crearReseniaValidation),
    reseniaController.crear,
  );
  return router;
}
