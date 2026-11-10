export const SECRET_DE_TEST = "secreto-solo-para-tests";

export function leerEntorno(env = process.env) {
  const nodeEnv = env.NODE_ENV ?? "development";
  const jwtSecret = env.JWT_SECRET ?? (nodeEnv === "test" ? SECRET_DE_TEST : undefined);
  if (!jwtSecret) {
    throw new Error("Falta la variable de entorno JWT_SECRET");
  }
  return {
    port: Number(env.PORT ?? 3000),
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN ?? "8h",
    nodeEnv,
  };
}
