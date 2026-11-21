import { useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import { TextInput } from "react-native-paper";
import { listarCategorias } from "../../api/categoriasApi";
import { useDebounce } from "../../hooks/useDebounce";
import { paginaDe, useListaPaginada } from "../../hooks/useListaPaginada";
import { espaciado } from "../../tema/espaciado";
import { ErrorCampo } from "./ErrorCampo";
import { ListaDeCategorias } from "./ListaDeCategorias";

export const DEMORA_BUSQUEDA = 300;
const pedirCategorias = paginaDe(listarCategorias, "categorias");

function useBuscadorDeCategorias(categoria, onElegir) {
  const [texto, setTexto] = useState(categoria?.nombre ?? "");
  const [abierta, setAbierta] = useState(false);
  const demorado = useDebounce(texto.trim(), DEMORA_BUSQUEDA);
  const lista = useListaPaginada(pedirCategorias, { q: demorado || undefined });
  return {
    texto,
    abierta,
    lista,
    abrir: () => setAbierta(true),
    escribir: (nuevo) => {
      setTexto(nuevo);
      setAbierta(true);
      if (categoria) onElegir(null);
    },
    elegir: (opcion) => {
      setTexto(opcion.nombre);
      setAbierta(false);
      onElegir(opcion);
      Keyboard.dismiss();
    },
  };
}

export function SelectorCategoria({ categoria, onElegir, deshabilitado, error, foco }) {
  const buscador = useBuscadorDeCategorias(categoria, onElegir);
  return (
    <View {...foco.registrar("categoria")} style={estilos.campo}>
      <TextInput
        ref={foco.registrarEntrada("categoria")}
        mode="outlined"
        label="Categoría"
        placeholder="Buscá o elegí una categoría"
        value={buscador.texto}
        onChangeText={buscador.escribir}
        onFocus={buscador.abrir}
        left={<TextInput.Icon icon="magnify" />}
        disabled={deshabilitado}
        error={!!error}
        accessibilityHint={error}
        testID="evento-categoria"
      />
      <ErrorCampo mensaje={error} testID="evento-categoria-error" />
      {buscador.abierta && <ListaDeCategorias lista={buscador.lista} onElegir={buscador.elegir} />}
    </View>
  );
}

const estilos = StyleSheet.create({ campo: { gap: espaciado.xs } });
