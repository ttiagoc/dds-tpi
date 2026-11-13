import { screen, fireEvent } from "@testing-library/react-native";
import { renderConProviders } from "../test-utils/renderConProviders";
import { compraResumen } from "../test-utils/fixtures";
import { TarjetaCompra } from "./TarjetaCompra";
import { LineaDeTiempo } from "./LineaDeTiempo";

describe("TarjetaCompra", () => {
  it("muestra evento, tipo por cantidad, total, estado y días restantes", async () => {
    await renderConProviders(<TarjetaCompra compra={compraResumen()} onPress={jest.fn()} />);
    expect(screen.getByText("Los Piojos en River")).toBeTruthy();
    expect(screen.getByText(/Estadio River Plate/)).toBeTruthy();
    expect(screen.getByText(/^Campo × 2 · \$\s90\.000$/)).toBeTruthy();
    expect(screen.getByLabelText("Estado: Confirmada")).toBeTruthy();
    expect(screen.getByTestId("dias-restantes-7")).toHaveTextContent("Faltan 12 días");
    expect(screen.getByLabelText(/^Los Piojos en River, Confirmada, Faltan 12 días/)).toBeTruthy();
  });

  it("con conComprador muestra el comprador como título, sin fecha ni lugar", async () => {
    await renderConProviders(
      <TarjetaCompra compra={compraResumen()} conComprador onPress={jest.fn()} />,
    );
    expect(screen.getByText("Ana Pérez")).toBeTruthy();
    expect(screen.queryByText("Los Piojos en River")).toBeNull();
    expect(screen.queryByText(/Estadio River Plate/)).toBeNull();
    expect(screen.getByLabelText(/^Ana Pérez, Confirmada/)).toBeTruthy();
  });

  it("sin días restantes no muestra el contador", async () => {
    const compra = compraResumen({ estado: "REEMBOLSADA", diasRestantes: null });
    await renderConProviders(<TarjetaCompra compra={compra} onPress={jest.fn()} />);
    expect(screen.getByLabelText("Estado: Reembolsada")).toBeTruthy();
    expect(screen.queryByTestId("dias-restantes-7")).toBeNull();
  });

  it("al tocarla llama a onPress", async () => {
    const onPress = jest.fn();
    await renderConProviders(<TarjetaCompra compra={compraResumen()} onPress={onPress} />);
    await fireEvent.press(screen.getByTestId("compra-7"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("LineaDeTiempo", () => {
  const historial = [
    {
      estado: "PENDIENTE",
      quien: { id: 1, nombre: "Ana Pérez" },
      fechaHora: "2026-11-01T15:00:00Z",
    },
    {
      estado: "CONFIRMADA",
      quien: { id: 1, nombre: "Ana Pérez" },
      fechaHora: "2026-11-01T15:05:00Z",
    },
    {
      estado: "CANCELADA",
      quien: { id: 1, nombre: "Ana Pérez" },
      fechaHora: "2026-11-02T10:00:00Z",
    },
  ];

  it("muestra un paso por cambio, en orden, con estado, quién y fecha", async () => {
    await renderConProviders(<LineaDeTiempo historial={historial} />);
    expect(screen.getByTestId("historial-0")).toHaveTextContent(/Pendiente/);
    expect(screen.getByTestId("historial-1")).toHaveTextContent(/Confirmada/);
    expect(screen.getByTestId("historial-2")).toHaveTextContent(/Cancelada/);
    expect(screen.getByTestId("historial-2")).toHaveTextContent(/Ana Pérez · .*nov/);
    expect(screen.queryByTestId("historial-3")).toBeNull();
  });
});
