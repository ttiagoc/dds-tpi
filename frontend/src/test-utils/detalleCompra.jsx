import { screen } from "@testing-library/react-native";
import DetalleCompra from "../pantallas/detalle-compra/DetalleCompra";
import { compraDetalle } from "./fixtures";
import { ANA, renderConProviders } from "./renderConProviders";

export const SIN_ACCIONES = {
  puedePagar: false,
  puedeCancelar: false,
  puedeMarcarUtilizada: false,
  puedeReseniar: false,
};

export const paso = (estado, minuto) => ({
  estado,
  quien: { id: 1, nombre: "Ana Pérez" },
  fechaHora: `2026-11-01T15:${minuto}:00.000Z`,
});

export const REEMBOLSADA = compraDetalle({
  estado: "REEMBOLSADA",
  diasRestantes: null,
  acciones: SIN_ACCIONES,
  historial: ["PENDIENTE", "CONFIRMADA", "CANCELADA", "REEMBOLSADA"].map((estado, i) => ({
    estado,
    quien: { id: 1, nombre: "Ana Pérez" },
    fechaHora: `2026-11-0${i + 1}T15:00:00.000Z`,
  })),
});

export async function abrirDetalleCompra(usuario = ANA) {
  await renderConProviders(<DetalleCompra />, { usuario });
  await screen.findByTestId("linea-de-tiempo");
}
