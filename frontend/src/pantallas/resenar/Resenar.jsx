import { StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { AvisoConVolver } from "../../components/AvisoConVolver";
import { ConCompra } from "../../components/ConCompra";
import { Contador } from "../../components/Contador";
import { EncabezadoEvento } from "../../components/EncabezadoEvento";
import { Estrellas } from "../../components/Estrellas";
import { Pantalla } from "../../components/Pantalla";
import { MAXIMO_DETALLE, useResenia } from "./useResenia";

function NoDisponible() {
  return (
    <AvisoConVolver
      icono="star-off-outline"
      texto="Esta compra no se puede reseñar"
      testID="resenia-no-disponible"
    />
  );
}

function Comentario({ resenia }) {
  return (
    <View>
      <TextInput
        mode="outlined"
        label="Contá tu experiencia"
        value={resenia.detalle}
        onChangeText={resenia.escribir}
        multiline
        numberOfLines={5}
        maxLength={MAXIMO_DETALLE}
        disabled={resenia.enviando}
        testID="resenia-detalle"
      />
      <Contador largo={resenia.detalle.length} maximo={MAXIMO_DETALLE} />
    </View>
  );
}

function Formulario({ compra }) {
  const resenia = useResenia(compra.id);
  return (
    <Pantalla scroll>
      <EncabezadoEvento evento={compra.evento} />
      <Text variant="titleMedium">¿Qué puntaje le das?</Text>
      <Estrellas
        valor={resenia.puntuacion}
        onElegir={resenia.elegirPuntuacion}
        deshabilitadas={resenia.enviando}
        tamanio={32}
      />
      <Comentario resenia={resenia} />
      {resenia.error && (
        <HelperText type="error" visible testID="resenia-error">
          {resenia.error}
        </HelperText>
      )}
      <Button
        mode="contained"
        icon="send"
        onPress={() => {
          resenia.confirmar();
        }}
        loading={resenia.enviando}
        disabled={!resenia.puedeEnviar}
        testID="resenia-enviar"
      >
        Enviar
      </Button>
    </Pantalla>
  );
}

export default function Resenar() {
  return (
    <ConCompra>
      {(compra) =>
        compra.acciones?.puedeReseniar ? <Formulario compra={compra} /> : <NoDisponible />
      }
    </ConCompra>
  );
}

const estilos = StyleSheet.create({});
