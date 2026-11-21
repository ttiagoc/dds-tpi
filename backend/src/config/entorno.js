import { GEOREF_URL } from "../services/geocodificacion/GeorefGeocodificador.js";

export const SECRET_DE_TEST = "secreto-solo-para-tests";

const POR_DEFECTO = {
  NODE_ENV: "development",
  PORT: "3000",
  JWT_EXPIRES_IN: "8h",
  GEOREF_URL,
};

export function leerEntorno(variables = process.env) {
  const env = { ...POR_DEFECTO, ...variables };
  const jwtSecret = env.JWT_SECRET ?? (env.NODE_ENV === "test" ? SECRET_DE_TEST : undefined);
  if (!jwtSecret) {
    throw new Error("Falta la variable de entorno JWT_SECRET");
  }
  return {
    port: Number(env.PORT),
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    georefUrl: env.GEOREF_URL,
    nodeEnv: env.NODE_ENV,
  };
}
