import { router } from "expo-router";
import { listarFavoritos } from "../../api/favoritosApi";
import { EstadoVacio } from "../../components/EstadoVacio";
import { ListaPaginada } from "../../components/ListaPaginada";
import { Pantalla } from "../../components/Pantalla";
import { TarjetaEvento } from "../../components/TarjetaEvento";
import { paginaDe, useListaPaginada } from "../../hooks/useListaPaginada";
import { useRecargarAlVolver } from "../../hooks/useRecargarAlVolver";

const pedirFavoritos = paginaDe(listarFavoritos, "eventos");

const SIN_CRITERIO = {};

export default function Favoritos() {
  const lista = useListaPaginada(pedirFavoritos, SIN_CRITERIO);
  useRecargarAlVolver(lista.recargar);
  return (
    <Pantalla>
      <ListaPaginada
        testID="lista-favoritos"
        lista={lista}
        renderItem={(evento) => (
          <TarjetaEvento evento={evento} onPress={() => router.push(`/eventos/${evento.id}`)} />
        )}
        vacio={
          <EstadoVacio
            icono="heart-outline"
            texto="Todavía no guardaste eventos"
            accion={{
              etiqueta: "Explorar eventos",
              onPress: () => router.navigate("/explorar"),
              testID: "ir-a-explorar",
            }}
            testID="sin-favoritos"
          />
        }
      />
    </Pantalla>
  );
}
