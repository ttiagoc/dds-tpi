import { cliente } from "./cliente";
import { subirImagen, urlDeImagen } from "./imagenes";

describe("urlDeImagen", () => {
  const original = cliente.defaults.baseURL;
  beforeEach(() => {
    cliente.defaults.baseURL = "http://192.168.1.9:3000";
  });
  afterEach(() => {
    cliente.defaults.baseURL = original;
  });

  it("completa una ruta del back con la URL del back", () => {
    expect(urlDeImagen("/imagenes/rock.jpg")).toBe("http://192.168.1.9:3000/imagenes/rock.jpg");
  });

  it("deja igual una URL absoluta y un valor vacío", () => {
    expect(urlDeImagen("https://imagenes.test/piojos.jpg")).toBe(
      "https://imagenes.test/piojos.jpg",
    );
    expect(urlDeImagen(null)).toBeNull();
  });
});

describe("subirImagen", () => {
  afterEach(() => jest.restoreAllMocks());

  it("manda el archivo del celular en el campo imagen como multipart y devuelve la url", async () => {
    const post = jest
      .spyOn(cliente, "post")
      .mockResolvedValue({ data: { url: "/imagenes/subidas/abc.jpg" } });
    const append = jest.spyOn(FormData.prototype, "append").mockImplementation(() => {});
    const url = await subirImagen({ uri: "file:///foto.jpg", mimeType: "image/png" });
    expect(url).toBe("/imagenes/subidas/abc.jpg");
    expect(append).toHaveBeenCalledWith("imagen", {
      uri: "file:///foto.jpg",
      name: "portada.jpg",
      type: "image/png",
    });
    const [ruta, datos, opciones] = post.mock.calls[0];
    expect(ruta).toBe("/imagenes");
    expect(datos).toBeInstanceOf(FormData);
    expect(opciones.headers["Content-Type"]).toBe("multipart/form-data");
  });
});
