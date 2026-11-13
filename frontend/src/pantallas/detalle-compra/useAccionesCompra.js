import { useState } from "react";
import { useEnvio } from "../../hooks/useEnvio";
import { accionDeCompra } from "./catalogoAcciones";

export function useAccionesCompra({ compra, reemplazar, recargar }) {
  const { enCurso, error, enviar } = useEnvio({ recargar });
  const [aviso, setAviso] = useState(null);

  const ejecutar = (nombre) => {
    const accion = accionDeCompra(nombre);
    return enviar(
      nombre,
      () => accion.pedir(compra.id),
      (actualizada) => {
        reemplazar(actualizada);
        setAviso(accion.aviso(actualizada));
      },
    );
  };

  return {
    enCurso,
    error,
    aviso,
    cerrarAviso: () => setAviso(null),
    ejecutar,
  };
}
