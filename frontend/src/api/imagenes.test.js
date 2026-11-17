import { cliente } from "./cliente";
import { urlDeImagen } from "./imagenes";

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
