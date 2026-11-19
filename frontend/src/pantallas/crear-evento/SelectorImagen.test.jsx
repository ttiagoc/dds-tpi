import { useState } from "react";
import { act, fireEvent, screen } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { subirImagen } from "../../api/imagenes";
import { renderConProviders } from "../../test-utils/renderConProviders";
import { errorHttp, promesaManual } from "../../test-utils/fixtures";
import { SelectorImagen } from "./SelectorImagen";
import { MENSAJE_SIN_PERMISO_FOTOS, useSubidaDeImagen } from "./useSubidaDeImagen";

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock("../../api/imagenes", () => ({
  ...jest.requireActual("../../api/imagenes"),
  subirImagen: jest.fn(),
}));

const ASSET = {
  uri: "file:///galeria/portada.jpg",
  fileName: "portada.jpg",
  mimeType: "image/jpeg",
};
const alCambiar = jest.fn();

function Formulario() {
  const [url, setUrl] = useState("");
  const subida = useSubidaDeImagen((nueva) => {
    setUrl(nueva);
    alCambiar(nueva);
  });
  return <SelectorImagen url={url} subida={subida} deshabilitado={false} />;
}

const abrir = () => renderConProviders(<Formulario />);
const elegir = async () => {
  await fireEvent.press(screen.getByTestId("evento-imagen"));
  await act(async () => {});
};

beforeEach(() => {
  jest.clearAllMocks();
  ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
  ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [ASSET] });
  subirImagen.mockResolvedValue("/imagenes/subidas/abc.jpg");
});

describe("SelectorImagen", () => {
  it("sin foto invita a agregar la portada desde la galería", async () => {
    await abrir();
    expect(screen.getByTestId("evento-imagen")).toHaveTextContent(/Agregar foto de portada/);
  });

  it("elegir abre la galería recortando 16:9, sube y guarda la url", async () => {
    await abrir();
    await elegir();
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ["images"], allowsEditing: true, aspect: [16, 9] }),
    );
    expect(subirImagen).toHaveBeenCalledWith(ASSET);
    expect(alCambiar).toHaveBeenLastCalledWith("/imagenes/subidas/abc.jpg");
    expect(screen.getByTestId("evento-imagen-vista").props.source).toEqual({ uri: ASSET.uri });
  });

  it("mientras sube muestra el indicador y no deja cambiar ni quitar", async () => {
    const subida = promesaManual();
    subirImagen.mockReturnValue(subida.promesa);
    await abrir();
    await elegir();
    expect(screen.getByTestId("evento-imagen-subiendo")).toBeTruthy();
    expect(screen.getByTestId("evento-imagen-quitar")).toBeDisabled();
  });

  it("quitar vuelve al recuadro y borra la url", async () => {
    await abrir();
    await elegir();
    await fireEvent.press(screen.getByTestId("evento-imagen-quitar"));
    expect(alCambiar).toHaveBeenLastCalledWith("");
    expect(screen.getByTestId("evento-imagen")).toBeTruthy();
  });

  it("si cancela la galería no sube nada", async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });
    await abrir();
    await elegir();
    expect(subirImagen).not.toHaveBeenCalled();
    expect(screen.getByTestId("evento-imagen")).toBeTruthy();
  });

  it("sin permiso de galería lo explica", async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false });
    await abrir();
    await elegir();
    expect(screen.getByTestId("evento-imagen-error")).toHaveTextContent(MENSAJE_SIN_PERMISO_FOTOS);
    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it("si la subida falla muestra el texto del back y se puede reintentar", async () => {
    subirImagen.mockRejectedValueOnce(errorHttp(413, "La imagen no puede pesar más de 5 MB"));
    await abrir();
    await elegir();
    expect(screen.getByTestId("evento-imagen-error")).toHaveTextContent(
      "La imagen no puede pesar más de 5 MB",
    );
    expect(alCambiar).not.toHaveBeenCalled();
    await elegir();
    expect(alCambiar).toHaveBeenLastCalledWith("/imagenes/subidas/abc.jpg");
    expect(screen.queryByTestId("evento-imagen-error")).toBeNull();
  });
});
