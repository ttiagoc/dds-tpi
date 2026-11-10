export function detallesZod(error) {
  return error.issues.map((issue) => ({
    campo: issue.path.join("."),
    mensaje: issue.message,
  }));
}
