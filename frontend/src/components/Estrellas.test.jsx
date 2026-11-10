import { screen } from "@testing-library/react-native";
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
