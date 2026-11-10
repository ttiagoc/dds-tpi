import { describe, it, expect } from "@jest/globals";
import { crearContenedor } from "../src/contenedor.js";
import { relojSistema } from "../src/config/reloj.js";
import { InMemoryRepository } from "../src/repositories/InMemoryRepository.js";
import { AuthService } from "../src/services/AuthService.js";
import { EventoService } from "../src/services/EventoService.js";
import { CategoriaService } from "../src/services/CategoriaService.js";
import { AHORA } from "./helpers/domainFactories.js";

const relojFijo = { ahora: () => AHORA };

describe("crearContenedor", () => {
  it("usa el reloj del sistema por defecto", () => {
    expect(crearContenedor().reloj).toBe(relojSistema);
  });

  it("respeta el reloj inyectado", () => {
    expect(crearContenedor({ reloj: relojFijo }).reloj).toBe(relojFijo);
  });

  it("crea los cinco repos en memoria", () => {
    const { repos } = crearContenedor();
    expect(Object.keys(repos).sort()).toEqual([
      "categoriaRepository",
      "compraRepository",
      "eventoRepository",
      "reseniaRepository",
      "usuarioRepository",
    ]);
    for (const repo of Object.values(repos)) {
      expect(repo).toBeInstanceOf(InMemoryRepository);
    }
  });

  it("expone authService con el repo de usuarios y la config del entorno", () => {
    const entorno = { jwtSecret: "s", jwtExpiresIn: "1h" };
    const { servicios, repos } = crearContenedor({ entorno });
    expect(servicios.authService).toBeInstanceOf(AuthService);
    expect(servicios.authService.usuarioRepository).toBe(repos.usuarioRepository);
    expect(servicios.authService.jwtSecret).toBe("s");
    expect(servicios.authService.jwtExpiresIn).toBe("1h");
  });

  it("expone eventoService y categoriaService con los repos únicos y el reloj", () => {
    const { servicios, repos } = crearContenedor({ reloj: relojFijo });
    expect(servicios.eventoService).toBeInstanceOf(EventoService);
    expect(servicios.eventoService.eventoRepository).toBe(repos.eventoRepository);
    expect(servicios.eventoService.reseniaRepository).toBe(repos.reseniaRepository);
    expect(servicios.eventoService.usuarioRepository).toBe(repos.usuarioRepository);
    expect(servicios.eventoService.reloj).toBe(relojFijo);
    expect(servicios.categoriaService).toBeInstanceOf(CategoriaService);
    expect(servicios.categoriaService.categoriaRepository).toBe(repos.categoriaRepository);
  });

  it("cada llamada arma repos independientes", () => {
    expect(crearContenedor().repos.compraRepository).not.toBe(
      crearContenedor().repos.compraRepository,
    );
  });

  it("resetear dos veces deja los mismos ids y cantidades", async () => {
    const contenedor = crearContenedor({ reloj: relojFijo });
    const foto = async () =>
      Promise.all(
        Object.values(contenedor.repos).map(async (repo) =>
          (await repo.findAll()).map((e) => e.id),
        ),
      );
    await contenedor.resetear();
    const primera = await foto();
    await contenedor.resetear();
    expect(await foto()).toEqual(primera);
    expect(primera.every((ids) => ids.length > 0 && ids[0] === 1)).toBe(true);
  });
});
