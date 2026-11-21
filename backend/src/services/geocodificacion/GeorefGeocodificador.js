import { partesDeDireccion } from "../../domain/direccion.js";

export const GEOREF_URL = "https://apis.datos.gob.ar/georef/api";
const TIMEOUT_MS = 5000;
const MAXIMO_RESULTADOS = 5;

export class GeocodificadorNoDisponible extends Error {}

const filtros = (calle, otros) => ({ direccion: calle, ...otros });

export function consultas(direccion) {
  const partes = partesDeDireccion(direccion);
  const calle = partes[0].replace(/^calle\s+/i, "");
  if (partes.length === 2) {
    const lugar = partes[1];
    return ["provincia", "localidad", "departamento"].map((clave) =>
      filtros(calle, { [clave]: lugar }),
    );
  }
  const provincia = partes.at(-1);
  const lugar = partes.at(-2);
  return [
    filtros(calle, { provincia, localidad: lugar }),
    filtros(calle, { provincia, departamento: lugar }),
    filtros(calle, { provincia }),
  ];
}

const primeraConUbicacion = (direcciones) =>
  (direcciones ?? []).find((d) => d.ubicacion?.lat != null && d.ubicacion?.lon != null);

export class GeorefGeocodificador {
  constructor({ url = GEOREF_URL, fetch = globalThis.fetch } = {}) {
    this.url = url;
    this.fetch = fetch;
  }

  async ubicar(direccion) {
    for (const filtro of consultas(direccion)) {
      const encontrada = await this.consultar(filtro);
      if (encontrada)
        return { latitud: encontrada.ubicacion.lat, longitud: encontrada.ubicacion.lon };
    }
    return null;
  }

  async consultar(filtro) {
    const parametros = new URLSearchParams({ ...filtro, max: String(MAXIMO_RESULTADOS) });
    const respuesta = await this.pedir(`${this.url}/direcciones?${parametros}`);
    if (respuesta.status >= 500) {
      throw new GeocodificadorNoDisponible(`Georef respondió ${respuesta.status}`);
    }
    if (!respuesta.ok) return null;
    const { direcciones } = await respuesta.json();
    return primeraConUbicacion(direcciones);
  }

  async pedir(url) {
    try {
      return await this.fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (error) {
      throw new GeocodificadorNoDisponible(`No se pudo consultar Georef: ${error.message}`);
    }
  }
}
