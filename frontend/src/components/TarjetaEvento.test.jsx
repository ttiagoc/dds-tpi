import { screen, fireEvent } from "@testing-library/react-native";
import { renderConProviders } from "../test-utils/renderConProviders";
import { eventoResumen } from "../test-utils/fixtures";
import { TarjetaEvento } from "./TarjetaEvento";

describe("TarjetaEvento", () => {
  it("muestra nombre, fecha, lugar, precio desde y puntaje del organizador", async () => {
    await renderConProviders(<TarjetaEvento evento={eventoResumen()} onPress={jest.fn()} />);
    expect(screen.getByText("Los Piojos en River")).toBeTruthy();
    expect(screen.getByText(/Estadio River Plate/)).toBeTruthy();
    expect(screen.getByText(/dic/)).toBeTruthy();
    expect(screen.getByText(/^Desde \$\s45\.000$/)).toBeTruthy();
    expect(screen.getByText("Fénix Producciones")).toBeTruthy();
    expect(screen.getByLabelText("Puntaje 4,5 de 5")).toBeTruthy();
    expect(screen.getByLabelText("Imagen de Los Piojos en River")).toBeTruthy();
  });

  it("la tarjeta se anuncia con nombre, fecha, lugar y precio desde", async () => {
    await renderConProviders(<TarjetaEvento evento={eventoResumen()} onPress={jest.fn()} />);
    expect(
      screen.getByLabelText(
        /^Los Piojos en River, .*dic.*, Estadio River Plate, desde \$\s45\.000$/,
      ),
    ).toBeTruthy();
  });

  it("al tocarla llama a onPress", async () => {
    const onPress = jest.fn();
    await renderConProviders(<TarjetaEvento evento={eventoResumen({ id: 7 })} onPress={onPress} />);
    await fireEvent.press(screen.getByTestId("tarjeta-evento-7"));
    expect(onPress).toHaveBeenCalled();
  });

  it("sin imagen muestra un placeholder y sin puntaje dice Sin reseñas", async () => {
    const evento = eventoResumen({
      imagen: null,
      organizador: { id: 4, nombre: "Konex", puntajePromedio: null },
    });
    await renderConProviders(<TarjetaEvento evento={evento} onPress={jest.fn()} />);
    expect(screen.getByTestId("imagen-placeholder")).toBeTruthy();
    expect(screen.getByText("Sin reseñas")).toBeTruthy();
    expect(screen.queryByLabelText(/Puntaje/)).toBeNull();
  });

  it("si la imagen no carga muestra el placeholder", async () => {
    await renderConProviders(<TarjetaEvento evento={eventoResumen()} onPress={jest.fn()} />);
    expect(screen.queryByTestId("imagen-placeholder")).toBeNull();
    await fireEvent(screen.getByLabelText("Imagen de Los Piojos en River"), "error");
    expect(screen.getByTestId("imagen-placeholder")).toBeTruthy();
  });
});
