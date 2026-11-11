import { cliente } from "./cliente";
import { buscarEventos, listarComprasDelEvento, obtenerEvento } from "./eventosApi";
import { listarCategorias } from "./categoriasApi";
import { listarMisEventos, obtenerReseniasDeOrganizador } from "./organizadoresApi";
import { agregarFavorito, listarFavoritos, quitarFavorito } from "./favoritosApi";
import {
  cancelarCompra,
  crearCompra,
  listarMisCompras,
  marcarUtilizada,
  obtenerCompra,
  pagarCompra,
  reseniarCompra,
} from "./comprasApi";

jest.mock("./cliente", () => ({
  cliente: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  for (const metodo of ["get", "post", "put", "delete"]) {
    cliente[metodo].mockResolvedValue({ data: "respuesta" });
  }
});

describe("eventosApi", () => {
  it("buscarEventos omite los parámetros vacíos y devuelve data", async () => {
    const datos = await buscarEventos({
      q: "",
      categoria: null,
      ordenarPor: "precio",
      orden: "asc",
      page: 2,
      limit: 10,
    });
    expect(cliente.get).toHaveBeenCalledWith("/eventos", {
      params: { ordenarPor: "precio", orden: "asc", page: 2, limit: 10 },
    });
    expect(datos).toBe("respuesta");
  });

  it("buscarEventos manda el texto y la categoría cuando están", async () => {
    await buscarEventos({ q: "piojos", categoria: 3 });
    expect(cliente.get).toHaveBeenCalledWith("/eventos", { params: { q: "piojos", categoria: 3 } });
  });

  it("listarComprasDelEvento omite el estado vacío y devuelve data", async () => {
    expect(await listarComprasDelEvento(4, { estado: null, page: 1, limit: 10 })).toBe("respuesta");
    expect(cliente.get).toHaveBeenCalledWith("/eventos/4/compras", {
      params: { page: 1, limit: 10 },
    });
  });

  it("obtenerEvento pide el detalle", async () => {
    expect(await obtenerEvento("4")).toBe("respuesta");
    expect(cliente.get).toHaveBeenCalledWith("/eventos/4");
  });
});

describe("categorías, organizadores y favoritos", () => {
  it("listarCategorias", async () => {
    expect(await listarCategorias()).toBe("respuesta");
    expect(cliente.get).toHaveBeenCalledWith("/categorias");
  });

  it("obtenerReseniasDeOrganizador con paginado", async () => {
    await obtenerReseniasDeOrganizador(2, { limit: 3 });
    expect(cliente.get).toHaveBeenCalledWith("/organizadores/2/resenias", {
      params: { limit: 3 },
    });
  });

  it("listarMisEventos pide los eventos del organizador con paginado", async () => {
    expect(await listarMisEventos({ page: 2, limit: 10 })).toBe("respuesta");
    expect(cliente.get).toHaveBeenCalledWith("/organizadores/yo/eventos", {
      params: { page: 2, limit: 10 },
    });
  });

  it("agregarFavorito y quitarFavorito", async () => {
    await agregarFavorito(7);
    await quitarFavorito(7);
    expect(cliente.put).toHaveBeenCalledWith("/usuarios/yo/favoritos/7");
    expect(cliente.delete).toHaveBeenCalledWith("/usuarios/yo/favoritos/7");
  });

  it("listarFavoritos pide los favoritos del usuario y devuelve data", async () => {
    expect(await listarFavoritos()).toBe("respuesta");
    expect(cliente.get).toHaveBeenCalledWith("/usuarios/yo/favoritos");
  });
});

describe("comprasApi", () => {
  it("crearCompra hace POST /compras y devuelve data", async () => {
    const compra = { eventoId: 1, tipoEntradaId: 10, cantidad: 2 };
    expect(await crearCompra(compra)).toBe("respuesta");
    expect(cliente.post).toHaveBeenCalledWith("/compras", compra);
  });

  it("listarMisCompras omite el estado vacío y devuelve data", async () => {
    expect(await listarMisCompras({ estado: null, page: 2, limit: 10 })).toBe("respuesta");
    expect(cliente.get).toHaveBeenCalledWith("/compras", { params: { page: 2, limit: 10 } });
  });

  it("obtenerCompra pide el detalle", async () => {
    expect(await obtenerCompra("7")).toBe("respuesta");
    expect(cliente.get).toHaveBeenCalledWith("/compras/7");
  });

  it("pagarCompra hace POST /compras/:id/pago y devuelve data", async () => {
    expect(await pagarCompra(7)).toBe("respuesta");
    expect(cliente.post).toHaveBeenCalledWith("/compras/7/pago");
  });

  it("cancelarCompra hace POST /compras/:id/cancelacion y devuelve data", async () => {
    expect(await cancelarCompra(7)).toBe("respuesta");
    expect(cliente.post).toHaveBeenCalledWith("/compras/7/cancelacion");
  });

  it("reseniarCompra hace POST /compras/:id/resenia con el body y devuelve data", async () => {
    const resenia = { puntuacion: 5, detalle: "Excelente" };
    expect(await reseniarCompra(7, resenia)).toBe("respuesta");
    expect(cliente.post).toHaveBeenCalledWith("/compras/7/resenia", resenia);
  });
});

describe("marcarUtilizada", () => {
  it("hace POST /compras/:id/uso y devuelve data", async () => {
    expect(await marcarUtilizada(7)).toBe("respuesta");
    expect(cliente.post).toHaveBeenCalledWith("/compras/7/uso");
  });
});
