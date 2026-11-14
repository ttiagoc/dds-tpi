import { Text } from "react-native-paper";
import { StyleSheet } from "react-native";
import { screen, fireEvent, within } from "@testing-library/react-native";
import { renderConProviders } from "../test-utils/renderConProviders";
import { BarraDeVentas } from "./BarraDeVentas";
import { ChipEstado } from "./ChipEstado";
import { ChipsFiltro } from "./ChipsFiltro";
import { Contador } from "./Contador";
import { ErrorCarga } from "./ErrorCarga";
import { EstadoVacio } from "./EstadoVacio";
import { Cargando } from "./Cargando";
import { Pantalla } from "./Pantalla";
import { espaciado } from "../tema/espaciado";

describe("ChipEstado", () => {
  it.each([
    ["PENDIENTE", "Pendiente"],
    ["CONFIRMADA", "Confirmada"],
    ["UTILIZADA", "Utilizada"],
    ["CANCELADA", "Cancelada"],
    ["REEMBOLSADA", "Reembolsada"],
  ])("muestra %s como texto, no solo color", async (estado, etiqueta) => {
    await renderConProviders(<ChipEstado estado={estado} />);
    expect(screen.getByText(etiqueta)).toBeTruthy();
    expect(screen.getByLabelText(`Estado: ${etiqueta}`)).toBeTruthy();
    expect(screen.getByTestId(`chip-estado-${estado}`)).toBeTruthy();
  });
});

it("ChipEstado con un estado desconocido muestra el texto tal cual sin romper", async () => {
  await renderConProviders(<ChipEstado estado="EN_REVISION" />);
  expect(screen.getByText("EN_REVISION")).toBeTruthy();
  expect(screen.getByTestId("chip-estado-EN_REVISION")).toBeTruthy();
});

describe("ErrorCarga", () => {
  it("muestra el mensaje y Reintentar llama a la acción", async () => {
    const onReintentar = jest.fn();
    await renderConProviders(
      <ErrorCarga mensaje="No existe el evento" onReintentar={onReintentar} />,
    );
    expect(screen.getByText("No existe el evento")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });

  it("sin acción no muestra Reintentar", async () => {
    await renderConProviders(<ErrorCarga mensaje="No tenés permiso" />);
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });
});

describe("EstadoVacio", () => {
  it("muestra el texto y la acción opcional", async () => {
    const onPress = jest.fn();
    await renderConProviders(
      <EstadoVacio
        icono="ticket-outline"
        texto="Todavía no compraste entradas"
        accion={{ etiqueta: "Explorar eventos", onPress }}
        testID="sin-compras"
      />,
    );
    expect(screen.getByTestId("sin-compras")).toBeTruthy();
    expect(screen.getByText("Todavía no compraste entradas")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Explorar eventos" }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("Cargando y Pantalla", () => {
  it("Cargando se anuncia para lectores de pantalla", async () => {
    await renderConProviders(<Cargando />);
    expect(screen.getByLabelText("Cargando")).toBeTruthy();
  });

  it("Pantalla renderiza sus hijos, con y sin scroll", async () => {
    await renderConProviders(
      <Pantalla testID="pantalla">
        <Text>Contenido</Text>
      </Pantalla>,
    );
    expect(screen.getByText("Contenido")).toBeTruthy();
    await renderConProviders(
      <Pantalla scroll>
        <Text>Con scroll</Text>
      </Pantalla>,
    );
    expect(screen.getByText("Con scroll")).toBeTruthy();
  });

  it("con scroll deja tocar botones con el teclado abierto", async () => {
    await renderConProviders(
      <Pantalla scroll bordes={["top"]} testID="pantalla">
        <Text>Formulario</Text>
      </Pantalla>,
    );
    expect(screen.getByTestId("pantalla").props.keyboardShouldPersistTaps).toBe("handled");
  });
});

describe("Contador", () => {
  it("muestra los caracteres usados sobre el máximo", async () => {
    await renderConProviders(<Contador largo={12} maximo={500} testID="contador" />);
    expect(screen.getByTestId("contador")).toHaveTextContent("12/500");
  });
});

describe("BarraDeVentas", () => {
  it("muestra vendidas sobre cupo con la barra en una pista de alto fijo", async () => {
    await renderConProviders(<BarraDeVentas vendidas={60} cupo={150} />);
    expect(screen.getByText("60 de 150 vendidas")).toBeTruthy();
    const pista = screen.getByTestId("barra-ventas-pista");
    expect(StyleSheet.flatten(pista.props.style).height).toBe(espaciado.xs);
    expect(within(pista).getByLabelText("60 de 150 vendidas")).toBeTruthy();
  });
});

describe("ChipsFiltro", () => {
  // Paper no expone el mode del Chip: el borde y el relleno quedan en el padre del nodo con testID.
  const estiloDe = (testID) => StyleSheet.flatten(screen.getByTestId(testID).parent.props.style);

  it("los no elegidos van delineados y el elegido con relleno", async () => {
    await renderConProviders(
      <ChipsFiltro
        opciones={[
          { valor: "A", etiqueta: "Uno" },
          { valor: "B", etiqueta: "Dos" },
        ]}
        seleccionada="A"
        onElegir={jest.fn()}
        prefijoTestID="filtro"
      />,
    );
    const elegido = estiloDe("filtro-A");
    for (const testID of ["filtro-todas", "filtro-B"]) {
      const noElegido = estiloDe(testID);
      expect(noElegido.borderColor).not.toBe("transparent");
      expect(noElegido.backgroundColor).not.toBe(elegido.backgroundColor);
    }
    expect(elegido.borderColor).toBe("transparent");
  });
});
