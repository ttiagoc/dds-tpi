import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native-paper";
import { listarComprasDelEvento } from "../../api/eventosApi";
import { EstadoVacio } from "../../components/EstadoVacio";
import { ListaDeCompras } from "../../components/ListaDeCompras";
import { Pantalla } from "../../components/Pantalla";
import { espaciado } from "../../tema/espaciado";
import { TipoDisponible } from "./Disponibilidad";

const pedirCompras = ({ id, ...criterio }, pagina) =>
  listarComprasDelEvento(id, { ...criterio, ...pagina }).then((respuesta) => ({
    items: respuesta.compras,
    page: respuesta.page,
    totalPages: respuesta.totalPages,
    extra: { evento: respuesta.evento, disponibilidad: respuesta.disponibilidad },
  }));

const VACIO = {
  textoFiltrada: (etiqueta) => `No hay compras en estado ${etiqueta}`,
  sinFiltro: <EstadoVacio icono="ticket-outline" texto="Este evento todavía no tiene compras" />,
};

function Encabezado({ extra, filtro }) {
  if (!extra) return null;
  return (
    <View style={estilos.encabezado}>
      <Text variant="headlineSmall">{extra.evento.nombre}</Text>
      {extra.disponibilidad.map((tipo) => (
        <TipoDisponible key={tipo.tipoEntradaId} tipo={tipo} />
      ))}
      <Text variant="titleMedium">Compras</Text>
      {filtro}
    </View>
  );
}

export default function ComprasDelEvento() {
  const { id } = useLocalSearchParams();
  return (
    <Pantalla>
      <ListaDeCompras
        testID="lista-compras-evento"
        pedir={pedirCompras}
        criterio={{ id }}
        conComprador
        vacio={VACIO}
        encabezado={Encabezado}
      />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({ encabezado: { gap: espaciado.sm } });
