import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Text, useTheme } from "react-native-paper";
import { listarComprasDelEvento } from "../../api/eventosApi";
import { EstadoVacio } from "../../components/EstadoVacio";
import { FiltroEstadoCompra } from "../../components/FiltroEstadoCompra";
import { ListaPaginada } from "../../components/ListaPaginada";
import { Pantalla } from "../../components/Pantalla";
import { TarjetaCompra } from "../../components/TarjetaCompra";
import { useListaPaginada } from "../../hooks/useListaPaginada";
import { useRecargarAlVolver } from "../../hooks/useRecargarAlVolver";
import { espaciado } from "../../tema/espaciado";
import { Disponibilidad } from "./Disponibilidad";

const pedirCompras = ({ id, ...criterio }, pagina) =>
  listarComprasDelEvento(id, { ...criterio, ...pagina }).then((respuesta) => ({
    items: respuesta.compras,
    page: respuesta.page,
    totalPages: respuesta.totalPages,
    extra: { evento: respuesta.evento, disponibilidad: respuesta.disponibilidad },
  }));

function Encabezado({ extra, estado, onElegir }) {
  if (!extra) return null;
  return (
    <View style={estilos.encabezado}>
      <Text variant="headlineSmall">{extra.evento.nombre}</Text>
      <Disponibilidad tipos={extra.disponibilidad} />
      <Text variant="titleMedium">Compras</Text>
      <FiltroEstadoCompra estado={estado} onElegir={onElegir} />
    </View>
  );
}

function SinCompras({ estado, onVerTodas }) {
  const { estados } = useTheme();
  if (!estado) {
    return <EstadoVacio icono="ticket-outline" texto="Este evento todavía no tiene compras" />;
  }
  return (
    <EstadoVacio
      icono="filter-remove-outline"
      texto={`No hay compras en estado ${estados[estado].etiqueta}`}
      accion={{ etiqueta: "Ver todas", onPress: onVerTodas, testID: "ver-todas" }}
    />
  );
}

export default function ComprasDelEvento() {
  const { id } = useLocalSearchParams();
  const [estado, setEstado] = useState(null);
  const lista = useListaPaginada(pedirCompras, { id, estado: estado ?? undefined });
  useRecargarAlVolver(lista.recargar);
  return (
    <Pantalla>
      <ListaPaginada
        testID="lista-compras-evento"
        lista={lista}
        renderItem={(compra) => (
          <TarjetaCompra
            compra={compra}
            conComprador
            onPress={() => router.push(`/compras/${compra.id}`)}
          />
        )}
        encabezado={<Encabezado extra={lista.extra} estado={estado} onElegir={setEstado} />}
        vacio={<SinCompras estado={estado} onVerTodas={() => setEstado(null)} />}
      />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({ encabezado: { gap: espaciado.md } });
