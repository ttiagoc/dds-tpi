import { ServiceUnavailableError } from "../errors/AppError.js";
import { MENSAJE_MAPA_NO_DISPONIBLE } from "../errors/mensajes.js";
import {
  GeocodificadorNoDisponible,
  ubicarOFallar,
} from "./geocodificacion/GeorefGeocodificador.js";

export const armarDireccion = ({ calle, numero, localidad, provincia }) =>
  `${calle} ${numero}, ${localidad}, ${provincia}`;

export class DireccionService {
  constructor({ geocodificador }) {
    this.geocodificador = geocodificador;
  }

  async ubicar(campos) {
    const direccion = armarDireccion(campos);
    try {
      return { direccion, ...(await ubicarOFallar(this.geocodificador, direccion)) };
    } catch (error) {
      if (error instanceof GeocodificadorNoDisponible) {
        throw new ServiceUnavailableError(MENSAJE_MAPA_NO_DISPONIBLE);
      }
      throw error;
    }
  }
}
