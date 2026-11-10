import express from "express";
import cors from "cors";
import { crearRouter } from "./routes/router.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { crearErrorLogger } from "./middlewares/errorLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export function crearApp(contenedor, { nodeEnv = process.env.NODE_ENV } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(crearRouter(contenedor));
  app.use(notFoundHandler);
  app.use(crearErrorLogger({ nodeEnv }));
  app.use(errorHandler);
  return app;
}
