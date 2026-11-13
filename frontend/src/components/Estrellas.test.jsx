import { fireEvent, screen } from "@testing-library/react-native";
import { renderConProviders } from "../test-utils/renderConProviders";
import { Estrellas } from "./Estrellas";

describe("Estrellas", () => {
  it("anuncia el puntaje con coma decimal", async () => {
    await renderConProviders(<Estrellas valor={4.5} />);
    expect(screen.getByLabelText("Puntaje 4,5 de 5")).toBeTruthy();
  });

  it("dibuja estrellas llenas, media y vacías según el valor", async () => {
    await renderConProviders(<Estrellas valor={3.5} />);
    expect(screen.getAllByTestId(/estrella-llena/)).toHaveLength(3);
    expect(screen.getAllByTestId(/estrella-media/)).toHaveLength(1);
    expect(screen.getAllByTestId(/estrella-vacia/)).toHaveLength(1);
  });

  it("redondea al medio punto más cercano", async () => {
    await renderConProviders(<Estrellas valor={4.2} />);
    expect(screen.getAllByTestId(/estrella-llena/)).toHaveLength(4);
    expect(screen.queryAllByTestId(/estrella-media/)).toHaveLength(0);
  });

  it("sin valor no renderiza nada", async () => {
    await renderConProviders(<Estrellas valor={null} />);
    expect(screen.queryByLabelText(/Puntaje/)).toBeNull();
  });
});

describe("Estrellas editables", () => {
  it("muestra cinco estrellas vacías tocables cuando todavía no hay puntaje", async () => {
    await renderConProviders(<Estrellas valor={null} onElegir={jest.fn()} />);
    [1, 2, 3, 4, 5].forEach((n) =>
      expect(screen.getByRole("button", { name: `Puntuar ${n} de 5` })).toBeTruthy(),
    );
    expect(screen.queryAllByTestId(/estrella-llena/)).toHaveLength(0);
  });

  it("tocar una estrella avisa la puntuación elegida", async () => {
    const onElegir = jest.fn();
    await renderConProviders(<Estrellas valor={null} onElegir={onElegir} />);
    await fireEvent.press(screen.getByTestId("estrella-3"));
    expect(onElegir).toHaveBeenCalledWith(3);
  });

  it("pinta llenas tantas estrellas como la puntuación", async () => {
    await renderConProviders(<Estrellas valor={3} onElegir={jest.fn()} />);
    expect(screen.getAllByTestId(/estrella-llena/)).toHaveLength(3);
    expect(screen.getAllByTestId(/estrella-vacia/)).toHaveLength(2);
  });

  it("deshabilitadas no avisan", async () => {
    const onElegir = jest.fn();
    await renderConProviders(<Estrellas valor={2} onElegir={onElegir} deshabilitadas />);
    await fireEvent.press(screen.getByTestId("estrella-4"));
    expect(onElegir).not.toHaveBeenCalled();
  });
});
