import { erroresDeDireccion } from "./direccionDelEvento";

const SIN_UBICACION = { ubicacion: null, mapaNoDisponible: false };

export const conCambio = (actual, campo, valor, esDeDireccion) => ({
  ...actual,
  [campo]: valor,
  ...(esDeDireccion ? SIN_UBICACION : {}),
});

export function useUbicacionDelEvento(valores, { setValores, setErrores }) {
  const cambiarUbicacion = (cambios) => setValores((actual) => ({ ...actual, ...cambios }));
  return {
    ubicar: (encontrada) => cambiarUbicacion({ ...SIN_UBICACION, ubicacion: encontrada }),
    confirmarUbicacion: () => {
      setErrores(({ ubicacion: _quitado, ...resto }) => resto);
      cambiarUbicacion({ ubicacion: { ...valores.ubicacion, confirmada: true } });
    },
    marcarMapaNoDisponible: () => {
      setErrores(({ ubicacion: _quitado, ...resto }) => resto);
      cambiarUbicacion({ ...SIN_UBICACION, mapaNoDisponible: true });
    },
    revisarDireccion: () => {
      const faltan = Object.fromEntries(erroresDeDireccion(valores).filter(([, m]) => m));
      setErrores((actuales) => ({ ...actuales, ...faltan }));
      return Object.keys(faltan).length === 0;
    },
  };
}
