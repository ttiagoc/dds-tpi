import { Rol } from "../../domain/Rol.js";
import { ref, ok, error, body, conAuth, respuestaDeError } from "./comun.js";

export default {
  tags: [{ name: "Auth", description: "Inicio de sesión con JWT" }],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesión",
        description:
          'Devuelve el token para usar en **Authorize**. Con un email o una contraseña incorrectos responde 401 "Email o contraseña incorrectos".',
        requestBody: body("LoginInput"),
        responses: {
          200: ok("Sesión iniciada", ref("Sesion")),
          400: error("BadRequest"),
          401: respuestaDeError("Email o contraseña incorrectos"),
        },
      },
    },
    "/auth/yo": {
      get: conAuth({
        tags: ["Auth"],
        summary: "Ver el usuario de la sesión",
        responses: { 200: ok("Usuario logueado", ref("Usuario")) },
      }),
    },
  },
  schemas: {
    LoginInput: {
      type: "object",
      required: ["email", "password"],
      additionalProperties: false,
      properties: {
        email: { type: "string", format: "email", example: "ana@aiticket.com" },
        password: { type: "string", minLength: 1, example: "Demo1234!" },
      },
    },
    Usuario: {
      type: "object",
      properties: {
        id: { type: "integer", example: 1 },
        nombre: { type: "string", example: "Ana" },
        apellido: { type: "string", example: "Pérez" },
        email: { type: "string", example: "ana@aiticket.com" },
        rol: { type: "string", enum: Object.values(Rol) },
      },
    },
    Sesion: {
      type: "object",
      properties: { token: { type: "string" }, usuario: ref("Usuario") },
    },
  },
};
