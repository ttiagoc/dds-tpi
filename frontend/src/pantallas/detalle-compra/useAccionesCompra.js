import { useState } from "react";
import { cancelarCompra, pagarCompra } from "../../api/comprasApi";
import { useEnvio } from "../../hooks/useEnvio";

const ACCIONES = {
  pagar: { pedir: pagarCompra, aviso: () => "Pago confirmado" },
  cancelar: {
    pedir: cancelarCompra,
    aviso: (compra) =>
      compra.estado === "REEMBOLSADA" ? "Compra cancelada y reembolsada" : "Compra cancelada",
  },
};

export function useAccionesCompra({ compra, reemplazar, recargar }) {
  const { enCurso, error, enviar } = useEnvio({ recargar });
  const [aviso, setAviso] = useState(null);

  const ejecutar = (nombre) => {
    const { pedir, aviso: textoDeAviso } = ACCIONES[nombre];
    return enviar(
      nombre,
      () => pedir(compra.id),
      (actualizada) => {
        reemplazar(actualizada);
        setAviso(textoDeAviso(actualizada));
      },
    );
  };

  return {
    enCurso,
    error,
    aviso,
    cerrarAviso: () => setAviso(null),
    pagar: () => ejecutar("pagar"),
    cancelar: () => ejecutar("cancelar"),
  };
}
