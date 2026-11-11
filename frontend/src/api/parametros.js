export const sinVacios = (parametros) =>
  Object.fromEntries(
    Object.entries(parametros).filter(([, valor]) => valor != null && valor !== ""),
  );
