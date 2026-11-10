import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { openapi } from "./docs/openapi/index.js";
import { crearRouter } from "./routes/router.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { crearErrorLogger } from "./middlewares/errorLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export function crearApp(contenedor, { nodeEnv = process.env.NODE_ENV } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get("/api-docs.json", (_req, res) => res.json(openapi));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapi));
  app.use(crearRouter(contenedor, { nodeEnv }));
  app.use(notFoundHandler);
  app.use(crearErrorLogger({ nodeEnv }));
  app.use(errorHandler);
  return app;
}
