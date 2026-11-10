import { Router } from "express";
import { CategoriaController } from "../controllers/CategoriaController.js";

export function crearCategoriaRoutes({ categoriaService }) {
  const router = Router();
  const controller = new CategoriaController(categoriaService);
  router.get("/", controller.listar);
  return router;
}
