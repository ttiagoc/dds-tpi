import { useColorScheme } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { PreferenciaTemaProvider, usePreferenciaTema } from "./PreferenciaTemaContext";
import { TemaDeLaApp } from "./TemaDeLaApp";
import { guardarPreferencia, leerPreferencia } from "./preferenciaTema";

jest.mock("./preferenciaTema", () => ({
  ...jest.requireActual("./preferenciaTema"),
  leerPreferencia: jest.fn(),
  guardarPreferencia: jest.fn(),
}));
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(),
}));

function Muestra() {
  const { dark } = useTheme();
  const { elegir } = usePreferenciaTema();
  return (
    <>
      <Text testID="modo">{dark ? "oscuro" : "claro"}</Text>
      <Button testID="elegir-automatico" onPress={() => elegir("automatico")}>
        Automático
      </Button>
    </>
  );
}

const renderApp = () =>
  render(
    <PreferenciaTemaProvider>
      <TemaDeLaApp>
        <Muestra />
      </TemaDeLaApp>
    </PreferenciaTemaProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  useColorScheme.mockReturnValue("dark");
  guardarPreferencia.mockResolvedValue();
});

describe("TemaDeLaApp", () => {
  it("sin preferencia guardada se ve claro aunque el celular esté en oscuro", async () => {
    leerPreferencia.mockResolvedValue("claro");
    await renderApp();
    expect(screen.getByTestId("modo")).toHaveTextContent("claro");
  });

  it("aplica la preferencia guardada", async () => {
    leerPreferencia.mockResolvedValue("oscuro");
    await renderApp();
    expect(await screen.findByText("oscuro")).toBeTruthy();
  });

  it("al elegir automático sigue al celular y guarda la elección", async () => {
    leerPreferencia.mockResolvedValue("claro");
    await renderApp();
    await fireEvent.press(screen.getByTestId("elegir-automatico"));
    expect(screen.getByTestId("modo")).toHaveTextContent("oscuro");
    expect(guardarPreferencia).toHaveBeenCalledWith("automatico");
  });
});
