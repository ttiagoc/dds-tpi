import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { renderConProviders } from "../test-utils/renderConProviders";
import { AvisoConVolver } from "./AvisoConVolver";

jest.mock("expo-router", () => require("../test-utils/mockRouter").mockRouter());

describe("AvisoConVolver", () => {
  it("muestra el texto y Volver vuelve a la pantalla anterior", async () => {
    router.canGoBack.mockReturnValue(true);
    await renderConProviders(
      <AvisoConVolver icono="ticket-outline" texto="No existe la compra" testID="aviso" />,
    );
    expect(screen.getByTestId("aviso")).toHaveTextContent(/No existe la compra/);
    await fireEvent.press(screen.getByTestId("volver"));
    expect(router.back).toHaveBeenCalled();
  });

  it("sin pantalla anterior Volver va al inicio", async () => {
    router.canGoBack.mockReturnValue(false);
    await renderConProviders(<AvisoConVolver icono="ticket-outline" texto="Nada" testID="aviso" />);
    await fireEvent.press(screen.getByTestId("volver"));
    expect(router.replace).toHaveBeenCalledWith("/");
  });
});
