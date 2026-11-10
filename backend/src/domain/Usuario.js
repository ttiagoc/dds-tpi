import { Rol } from "./Rol.js";
import { exigir, esTextoNoVacio } from "./validaciones.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Usuario {
  constructor({ id = null, nombre, apellido = "", email, passwordHash, rol, favoritos = [] }) {
    exigir(esTextoNoVacio(nombre), "El usuario necesita un nombre");
    exigir(typeof email === "string" && EMAIL.test(email), "El email no es válido");
    exigir(esTextoNoVacio(passwordHash), "El usuario necesita una contraseña");
    exigir(Object.values(Rol).includes(rol), "El rol no es válido");
    this.id = id;
    this.nombre = nombre.trim();
    this.apellido = (apellido ?? "").trim();
    this.email = email.toLowerCase();
    this.passwordHash = passwordHash;
    this.rol = rol;
    this.favoritos = [...favoritos];
  }

  nombreCompleto() {
    return [this.nombre, this.apellido].filter(Boolean).join(" ");
  }

  esOrganizador() {
    return this.rol === Rol.ORGANIZADOR;
  }

  esComprador() {
    return this.rol === Rol.COMPRADOR;
  }

  esFavorito(eventoId) {
    return this.favoritos.includes(eventoId);
  }

  agregarFavorito(eventoId) {
    if (!this.esFavorito(eventoId)) this.favoritos.push(eventoId);
  }

  quitarFavorito(eventoId) {
    this.favoritos = this.favoritos.filter((id) => id !== eventoId);
  }
}
