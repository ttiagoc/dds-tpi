import { describe, it, expect } from "@jest/globals";
import { Usuario } from "../../src/domain/Usuario.js";
import { Categoria } from "../../src/domain/Categoria.js";
import { Rol } from "../../src/domain/Rol.js";
import { UnprocessableEntityError } from "../../src/errors/AppError.js";
import { crearComprador, crearOrganizador } from "../helpers/domainFactories.js";

const datos = {
  nombre: "Ana",
  apellido: "Pérez",
  email: "ana@aiticket.com",
  passwordHash: "hash",
  rol: Rol.COMPRADOR,
};

describe("Usuario", () => {
  describe("constructor", () => {
    it("crea un usuario válido con favoritos vacíos y id nulo", () => {
      const usuario = new Usuario(datos);
      expect(usuario).toMatchObject({ id: null, nombre: "Ana", favoritos: [] });
    });

    it.each([
      [{ nombre: "  " }, "El usuario necesita un nombre"],
      [{ email: "ana" }, "El email no es válido"],
      [{ email: undefined }, "El email no es válido"],
      [{ passwordHash: "" }, "El usuario necesita una contraseña"],
      [{ rol: "ADMIN" }, "El rol no es válido"],
    ])("rechaza %p", (cambio, mensaje) => {
      expect(() => new Usuario({ ...datos, ...cambio })).toThrow(UnprocessableEntityError);
      expect(() => new Usuario({ ...datos, ...cambio })).toThrow(mensaje);
    });

    it("permite omitir el apellido", () => {
      expect(new Usuario({ ...datos, apellido: undefined }).apellido).toBe("");
      expect(new Usuario({ ...datos, apellido: null }).apellido).toBe("");
    });
  });

  describe("nombreCompleto", () => {
    it("une nombre y apellido", () => {
      expect(crearComprador().nombreCompleto()).toBe("Ana Pérez");
    });

    it("devuelve solo el nombre si no hay apellido", () => {
      expect(crearOrganizador().nombreCompleto()).toBe("Fénix Producciones");
    });
  });

  describe("roles", () => {
    it("distingue organizador de comprador", () => {
      expect(crearOrganizador().esOrganizador()).toBe(true);
      expect(crearOrganizador().esComprador()).toBe(false);
      expect(crearComprador().esComprador()).toBe(true);
      expect(crearComprador().esOrganizador()).toBe(false);
    });
  });

  describe("favoritos", () => {
    it("agrega un favorito una sola vez", () => {
      const usuario = crearComprador();
      usuario.agregarFavorito(5);
      usuario.agregarFavorito(5);
      expect(usuario.favoritos).toEqual([5]);
      expect(usuario.esFavorito(5)).toBe(true);
    });

    it("quita un favorito y no falla si no estaba", () => {
      const usuario = crearComprador({ favoritos: [1, 2] });
      usuario.quitarFavorito(1);
      usuario.quitarFavorito(9);
      expect(usuario.favoritos).toEqual([2]);
      expect(usuario.esFavorito(1)).toBe(false);
    });

    it("no comparte el arreglo de favoritos recibido", () => {
      const favoritos = [1];
      const usuario = crearComprador({ favoritos });
      usuario.agregarFavorito(2);
      expect(favoritos).toEqual([1]);
    });
  });
});

describe("Categoria", () => {
  it("crea una categoría con descripción opcional", () => {
    expect(new Categoria({ id: 1, nombre: "Teatro" })).toEqual({
      id: 1,
      nombre: "Teatro",
      descripcion: "",
    });
  });

  it("rechaza una categoría sin nombre", () => {
    expect(() => new Categoria({ nombre: "" })).toThrow("La categoría necesita un nombre");
  });
});
