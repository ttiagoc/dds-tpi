import { Text } from "react-native-paper";
import { Platform, StyleSheet } from "react-native";
import { screen, fireEvent, within } from "@testing-library/react-native";
import { renderConProviders } from "../test-utils/renderConProviders";
import { BarraDeVentas } from "./BarraDeVentas";
import { CampoNumero } from "./CampoNumero";
import { ChipEstado } from "./ChipEstado";
import { ConCarga } from "./ConCarga";
import { ChipsFiltro } from "./ChipsFiltro";
import { Contador } from "./Contador";
import { ErrorCarga } from "./ErrorCarga";
import { ErrorEnLinea } from "./ErrorEnLinea";
import { Logo } from "./Logo";
import { EstadoVacio } from "./EstadoVacio";
import { Cargando } from "./Cargando";
import { Pantalla } from "./Pantalla";
import { espaciado } from "../tema/espaciado";
import { temaClaro } from "../tema/tema";

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
    expect(screen.getByTestId(`chip-estado-${estado}-punto`)).toBeTruthy();
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

  it("con scroll arranca debajo del encabezado translúcido de iOS", async () => {
    await renderConProviders(
      <Pantalla scroll testID="pantalla">
        <Text>Detalle</Text>
      </Pantalla>,
    );
    expect(screen.getByTestId("pantalla").props.contentInsetAdjustmentBehavior).toBe("automatic");
  });

  it("con scroll sube el contenido con el teclado y deja bajarlo deslizando", async () => {
    await renderConProviders(
      <Pantalla scroll testID="pantalla">
        <Text>Formulario largo</Text>
      </Pantalla>,
    );
    const { props } = screen.getByTestId("pantalla");
    expect(props.automaticallyAdjustKeyboardInsets).toBe(true);
    expect(props.keyboardDismissMode).toBe("interactive");
  });
});

describe("CampoNumero", () => {
  const renderCampos = (onChangeText = jest.fn()) =>
    renderConProviders(
      <>
        <CampoNumero label="Precio" decimal value="" onChangeText={onChangeText} testID="precio" />
        <CampoNumero label="Cupo" value="" onChangeText={() => {}} testID="cupo" />
      </>,
    );

  it("en iOS usa el teclado con tecla de confirmar y propaga lo escrito", async () => {
    const onChangeText = jest.fn();
    await renderCampos(onChangeText);
    expect(screen.getByTestId("precio")).toHaveProp("keyboardType", "numbers-and-punctuation");
    expect(screen.getByTestId("precio")).toHaveProp("returnKeyType", "done");
    await fireEvent.changeText(screen.getByTestId("precio"), "1500");
    expect(onChangeText).toHaveBeenCalledWith("1500");
  });

  it("en Android usa el teclado decimal o entero", async () => {
    const original = Platform.OS;
    Platform.OS = "android";
    try {
      await renderCampos();
      expect(screen.getByTestId("precio")).toHaveProp("keyboardType", "decimal-pad");
      expect(screen.getByTestId("cupo")).toHaveProp("keyboardType", "number-pad");
    } finally {
      Platform.OS = original;
    }
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
    expect(elegido.borderColor).toBe(elegido.backgroundColor);
  });

  const OPCIONES = ["A", "B", "C", "D"].map((valor) => ({ valor, etiqueta: valor }));
  const medir = async ({ visible, contenido }) => {
    const fila = screen.getByTestId("filtro-fila");
    await fireEvent(fila, "layout", { nativeEvent: { layout: { width: visible, height: 40 } } });
    await fireEvent(fila, "contentSizeChange", contenido, 40);
  };
  const desplazar = (x) =>
    fireEvent.scroll(screen.getByTestId("filtro-fila"), {
      nativeEvent: {
        contentOffset: { x, y: 0 },
        contentSize: { width: 600, height: 40 },
        layoutMeasurement: { width: 300, height: 40 },
      },
    });
  const renderFila = () =>
    renderConProviders(
      <ChipsFiltro opciones={OPCIONES} onElegir={jest.fn()} prefijoTestID="filtro" />,
    );

  it("muestra la flecha de cada lado solo si hay chips de ese lado", async () => {
    await renderFila();
    await medir({ visible: 300, contenido: 600 });
    expect(screen.getByLabelText("Ver más filtros")).toBeTruthy();
    expect(screen.queryByTestId("filtro-menos")).toBeNull();
    await fireEvent.press(screen.getByTestId("filtro-mas"));
    await desplazar(100);
    expect(screen.getByLabelText("Ver filtros anteriores")).toBeTruthy();
    expect(screen.getByTestId("filtro-mas")).toBeTruthy();
    await desplazar(300);
    expect(screen.queryByTestId("filtro-mas")).toBeNull();
    await fireEvent.press(screen.getByTestId("filtro-menos"));
    await desplazar(0);
    expect(screen.queryByTestId("filtro-menos")).toBeNull();
  });

  it("las flechas van rellenas con la tinta para distinguirse del fondo", async () => {
    await renderFila();
    await medir({ visible: 300, contenido: 600 });
    const fondos = [];
    for (let nodo = screen.getByTestId("filtro-mas"); nodo; nodo = nodo.parent) {
      fondos.push(StyleSheet.flatten(nodo.props.style)?.backgroundColor);
    }
    expect(fondos).toContain(temaClaro.colors.onSurface);
  });

  it("si todos los chips entran no muestra el chevron", async () => {
    await renderFila();
    await medir({ visible: 400, contenido: 380 });
    expect(screen.queryByTestId("filtro-mas")).toBeNull();
  });
});

describe("ConCarga", () => {
  const carga = (cambios) => ({
    datos: null,
    cargando: false,
    error: null,
    codigoError: null,
    recargar: jest.fn(),
    ...cambios,
  });
  const contenido = (datos) => <Text>{`Datos: ${datos}`}</Text>;

  it("si falla una recarga con datos sigue mostrando los datos", async () => {
    await renderConProviders(
      <ConCarga carga={carga({ datos: "compra", error: "Sin conexión" })}>{contenido}</ConCarga>,
    );
    expect(screen.getByText("Datos: compra")).toBeTruthy();
    expect(screen.queryByText("Reintentar")).toBeNull();
  });

  it("sin datos muestra el error con Reintentar", async () => {
    await renderConProviders(
      <ConCarga carga={carga({ error: "Sin conexión" })}>{contenido}</ConCarga>,
    );
    expect(screen.getByText("Sin conexión")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
  });

  it("un 404 muestra el aviso aunque haya datos", async () => {
    await renderConProviders(
      <ConCarga
        carga={carga({ datos: "compra", error: "No existe la compra", codigoError: 404 })}
        iconoInexistente="ticket-outline"
        testIDInexistente="compra-inexistente"
      >
        {contenido}
      </ConCarga>,
    );
    expect(screen.getByTestId("compra-inexistente")).toHaveTextContent(/No existe la compra/);
  });
});

describe("ErrorEnLinea", () => {
  it("muestra el mensaje y Reintentar llama a la acción", async () => {
    const onReintentar = jest.fn();
    await renderConProviders(
      <ErrorEnLinea mensaje="Sin conexión" onReintentar={onReintentar} testID="algo-error" />,
    );
    expect(screen.getByTestId("algo-error")).toHaveTextContent("Sin conexión");
    await fireEvent.press(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });
});

describe("Logo", () => {
  it("muestra el ticket y el nombre, y se anuncia como AI Ticket It", async () => {
    await renderConProviders(<Logo />);
    expect(screen.getByLabelText("AI Ticket It")).toBeTruthy();
    expect(screen.getByTestId("logo")).toHaveTextContent(/AI\s*Ticket It/);
  });
});
