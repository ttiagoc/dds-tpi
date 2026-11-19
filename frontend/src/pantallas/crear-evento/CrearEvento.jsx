import { Button, HelperText, TextInput } from "react-native-paper";
import { Pantalla } from "../../components/Pantalla";
import { SelectorCategoria } from "./SelectorCategoria";
import { SelectorFechaHora } from "./SelectorFechaHora";
import { SelectorImagen } from "./SelectorImagen";
import { TiposDeEntrada } from "./TiposDeEntrada";
import { useFormularioEvento } from "./useFormularioEvento";
import { useSubidaDeImagen } from "./useSubidaDeImagen";

const TEXTOS = [
  { campo: "nombre", etiqueta: "Nombre", testID: "evento-nombre" },
  { campo: "descripcion", etiqueta: "Descripción", testID: "evento-descripcion", multilinea: true },
  { campo: "lugar", etiqueta: "Lugar", testID: "evento-lugar" },
];

function CampoTexto({ definicion, valor, onCambiar, deshabilitado }) {
  const { campo, etiqueta, testID, multilinea } = definicion;
  return (
    <TextInput
      mode="outlined"
      label={etiqueta}
      value={valor}
      onChangeText={(texto) => onCambiar(campo, texto)}
      multiline={!!multilinea}
      maxLength={multilinea ? 2000 : undefined}
      disabled={deshabilitado}
      testID={testID}
    />
  );
}

function Publicar({ formulario, subiendoImagen }) {
  return (
    <>
      {formulario.error && (
        <HelperText type="error" visible testID="evento-error">
          {formulario.error}
        </HelperText>
      )}
      <Button
        mode="contained"
        icon="calendar-check"
        onPress={() => {
          formulario.publicar();
        }}
        loading={formulario.enviando}
        disabled={!formulario.puedePublicar || subiendoImagen}
        testID="evento-guardar"
      >
        Publicar evento
      </Button>
    </>
  );
}

export default function CrearEvento() {
  const formulario = useFormularioEvento();
  const { valores, cambiar, enviando } = formulario;
  const subida = useSubidaDeImagen((url) => cambiar("imagen", url));
  return (
    <Pantalla scroll>
      <SelectorImagen url={valores.imagen} subida={subida} deshabilitado={enviando} />
      {TEXTOS.map((definicion) => (
        <CampoTexto
          key={definicion.campo}
          definicion={definicion}
          valor={valores[definicion.campo]}
          onCambiar={cambiar}
          deshabilitado={enviando}
        />
      ))}
      <SelectorCategoria
        categoria={valores.categoria}
        onElegir={(categoria) => cambiar("categoria", categoria)}
        deshabilitado={enviando}
      />
      <SelectorFechaHora
        dia={valores.dia}
        hora={valores.hora}
        onDia={(dia) => cambiar("dia", dia)}
        onHora={(hora) => cambiar("hora", hora)}
        deshabilitado={enviando}
      />
      <TiposDeEntrada formulario={formulario} deshabilitado={enviando} />
      <Publicar formulario={formulario} subiendoImagen={subida.subiendo} />
    </Pantalla>
  );
}
