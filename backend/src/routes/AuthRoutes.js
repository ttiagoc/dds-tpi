import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { validate } from "../middlewares/validate.js";
import { loginValidation } from "../validations/loginValidation.js";

export function crearAuthRoutes({ authService }, { autenticar }) {
  const router = Router();
  const controller = new AuthController(authService);
  router.post("/login", validate(loginValidation), controller.login);
  router.get("/yo", autenticar, controller.yo);
  return router;
}
