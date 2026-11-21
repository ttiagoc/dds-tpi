import { useState } from "react";
import { codigoDeError } from "../../api/cliente";
import { ubicarDireccion } from "../../api/direccionesApi";
import { useEnvio } from "../../hooks/useEnvio";
import { camposParaBuscar } from "./direccionDelEvento";

export const AVISO_MAPA_NO_DISPONIBLE = "No pudimos mostrar el mapa. Podés publicar igual";

export function useBusquedaDireccion(formulario) {
  const { enCurso, error, enviar } = useEnvio();
  const [noDisponible, setNoDisponible] = useState(false);
  const buscar = () => {
    if (!formulario.revisarDireccion()) return;
    setNoDisponible(false);
    enviar(
      "buscar",
      () => ubicarDireccion(camposParaBuscar(formulario.valores)),
      formulario.ubicar,
      (e) => {
        if (codigoDeError(e) !== 503) return;
        setNoDisponible(true);
        formulario.marcarMapaNoDisponible();
      },
    );
  };
  const mensaje = noDisponible ? AVISO_MAPA_NO_DISPONIBLE : error;
  return { buscando: enCurso !== null, mensaje, buscar };
}
