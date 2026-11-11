import { cliente } from "./cliente";
import { buscarEventos, obtenerEvento } from "./eventosApi";
import { listarCategorias } from "./categoriasApi";
import { obtenerReseniasDeOrganizador } from "./organizadoresApi";
import { agregarFavorito, quitarFavorito } from "./favoritosApi";
import { crearCompra } from "./comprasApi";

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

  it("agregarFavorito y quitarFavorito", async () => {
    await agregarFavorito(7);
    await quitarFavorito(7);
    expect(cliente.put).toHaveBeenCalledWith("/usuarios/yo/favoritos/7");
    expect(cliente.delete).toHaveBeenCalledWith("/usuarios/yo/favoritos/7");
  });
});

describe("comprasApi", () => {
  it("crearCompra hace POST /compras y devuelve data", async () => {
    const compra = { eventoId: 1, tipoEntradaId: 10, cantidad: 2 };
    expect(await crearCompra(compra)).toBe("respuesta");
    expect(cliente.post).toHaveBeenCalledWith("/compras", compra);
  });
});
