import { Router } from "express";

export function crearTestRoutes(contenedor) {
  const router = Router();
  router.post("/reset", async (_req, res) => {
    await contenedor.resetear();
    res.status(204).send();
  });
  return router;
}
