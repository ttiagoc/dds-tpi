import { Router } from "express";

// eslint-disable-next-line no-unused-vars
export function crearRouter(contenedor) {
  const router = Router();
  router.get("/healthcheck", (_req, res) => res.json({ status: "ok" }));
  return router;
}
