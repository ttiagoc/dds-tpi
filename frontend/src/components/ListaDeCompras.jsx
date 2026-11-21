import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useTheme } from "react-native-paper";
import { EstadoVacio } from "./EstadoVacio";
import { FiltroEstadoCompra } from "./FiltroEstadoCompra";
import { ListaPaginada } from "./ListaPaginada";
import { TarjetaCompra } from "./TarjetaCompra";
import { useListaPaginada } from "../hooks/useListaPaginada";
import { useRecargarAlVolver } from "../hooks/useRecargarAlVolver";
import { espaciado } from "../tema/espaciado";

function SinCompras({ estado, textoFiltrada, sinFiltro, onVerTodas, testID }) {
  const { estados } = useTheme();
  if (!estado) return sinFiltro;
  return (
    <EstadoVacio
      icono="filter-remove-outline"
      texto={textoFiltrada(estados[estado].etiqueta)}
      accion={{ etiqueta: "Ver todas", onPress: onVerTodas, testID: "ver-todas" }}
      testID={testID}
    />
  );
}

const soloFiltro = ({ filtro }) => filtro;

export function ListaDeCompras({
  pedir,
  criterio,
  testID,
  vacio,
  conComprador = false,
  encabezado = soloFiltro,
}) {
  const [estado, setEstado] = useState(null);
  const lista = useListaPaginada(pedir, { ...criterio, estado: estado ?? undefined });
  useRecargarAlVolver(lista.recargar);
  const filtro = <FiltroEstadoCompra estado={estado} onElegir={setEstado} />;
  return (
    <ListaPaginada
      testID={testID}
      lista={lista}
      renderItem={(compra) => (
        <TarjetaCompra
          compra={compra}
          conComprador={conComprador}
          onPress={() => router.push(`/compras/${compra.id}`)}
        />
      )}
      encabezado={
        <View style={estilos.encabezado} testID={`${testID}-encabezado`}>
          {encabezado({ extra: lista.extra, filtro })}
        </View>
      }
      vacio={<SinCompras estado={estado} onVerTodas={() => setEstado(null)} {...vacio} />}
    />
  );
}

const estilos = StyleSheet.create({ encabezado: { gap: espaciado.md } });
