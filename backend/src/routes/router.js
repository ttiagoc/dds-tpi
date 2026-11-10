import { Router } from "express";
import { crearTestRoutes } from "./TestRoutes.js";

export function crearRouter(contenedor, { nodeEnv }) {
  const router = Router();
  router.get("/healthcheck", (_req, res) => res.json({ status: "ok" }));
  if (nodeEnv === "test") router.use("/test", crearTestRoutes(contenedor));
  return router;
}
