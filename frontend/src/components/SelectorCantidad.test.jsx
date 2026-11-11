import { useState } from "react";
import { screen, fireEvent } from "@testing-library/react-native";
import { renderConProviders } from "../test-utils/renderConProviders";
import { SelectorCantidad } from "./SelectorCantidad";

function Envoltorio({ inicial = 1, max }) {
  const [valor, setValor] = useState(inicial);
  return <SelectorCantidad valor={valor} max={max} onCambiar={setValor} />;
}

describe("SelectorCantidad", () => {
  it("suma y resta de a uno con labels accesibles", async () => {
    await renderConProviders(<Envoltorio inicial={2} max={5} />);
    await fireEvent.press(screen.getByLabelText("Sumar uno"));
    expect(screen.getByTestId("cantidad-valor")).toHaveTextContent("3");
    await fireEvent.press(screen.getByLabelText("Restar uno"));
    await fireEvent.press(screen.getByLabelText("Restar uno"));
    expect(screen.getByTestId("cantidad-valor")).toHaveTextContent("1");
  });

  it("deshabilita restar en el mínimo y sumar en el máximo", async () => {
    await renderConProviders(<Envoltorio inicial={1} max={1} />);
    expect(screen.getByTestId("cantidad-menos")).toBeDisabled();
    expect(screen.getByTestId("cantidad-mas")).toBeDisabled();
  });
});
