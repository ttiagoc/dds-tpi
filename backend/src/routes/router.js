import { Router } from "express";
import { crearTestRoutes } from "./TestRoutes.js";
import { crearAuthRoutes } from "./AuthRoutes.js";
import { crearAutenticar, crearAutenticarOpcional } from "../middlewares/autenticar.js";

export function crearRouter(contenedor, { nodeEnv }) {
  const { authService } = contenedor.servicios;
  const auth = {
    autenticar: crearAutenticar(authService),
    autenticarOpcional: crearAutenticarOpcional(authService),
  };
  const router = Router();
  router.get("/healthcheck", (_req, res) => res.json({ status: "ok" }));
  router.use("/auth", crearAuthRoutes(contenedor.servicios, auth));
  if (nodeEnv === "test") router.use("/test", crearTestRoutes(contenedor));
  return router;
}
