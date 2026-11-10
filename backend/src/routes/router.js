import { Router } from "express";
import { crearTestRoutes } from "./TestRoutes.js";
import { crearAuthRoutes } from "./AuthRoutes.js";
import { crearCategoriaRoutes } from "./CategoriaRoutes.js";
import { crearEventoRoutes } from "./EventoRoutes.js";
import { crearOrganizadorRoutes } from "./OrganizadorRoutes.js";
import { crearCompraRoutes } from "./CompraRoutes.js";
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
  router.use("/categorias", crearCategoriaRoutes(contenedor.servicios));
  router.use("/eventos", crearEventoRoutes(contenedor.servicios, auth));
  router.use("/organizadores", crearOrganizadorRoutes(contenedor.servicios, auth));
  router.use("/compras", crearCompraRoutes(contenedor.servicios, auth));
  if (nodeEnv === "test") router.use("/test", crearTestRoutes(contenedor));
  return router;
}
