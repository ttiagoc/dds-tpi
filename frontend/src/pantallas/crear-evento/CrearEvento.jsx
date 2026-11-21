import { StyleSheet, View } from "react-native";
import { Button, HelperText, Snackbar, TextInput } from "react-native-paper";
import { Pantalla } from "../../components/Pantalla";
import { espaciado } from "../../tema/espaciado";
import { ErrorCampo } from "./ErrorCampo";
import { SelectorCategoria } from "./SelectorCategoria";
import { SelectorFechaHora } from "./SelectorFechaHora";
import { SelectorImagen } from "./SelectorImagen";
import { TiposDeEntrada } from "./TiposDeEntrada";
import { resumenDeErrores, useFormularioEvento } from "./useFormularioEvento";
import { useFoco } from "./useFoco";
import { useSubidaDeImagen } from "./useSubidaDeImagen";

const TEXTOS = [
  { campo: "nombre", etiqueta: "Nombre", testID: "evento-nombre" },
  { campo: "descripcion", etiqueta: "Descripción", testID: "evento-descripcion", multilinea: true },
  { campo: "lugar", etiqueta: "Lugar", testID: "evento-lugar" },
  {
    campo: "direccion",
    etiqueta: "Dirección",
    testID: "evento-direccion",
    ayuda: "Calle y número, localidad, provincia",
  },
];

function CampoTexto({ definicion, formulario, foco }) {
  const { campo, etiqueta, testID, multilinea, ayuda } = definicion;
  const error = formulario.errores[campo];
  return (
    <View {...foco.registrar(campo)} style={estilos.campo}>
      <TextInput
        ref={foco.registrarEntrada(campo)}
        mode="outlined"
        label={etiqueta}
        value={formulario.valores[campo]}
        onChangeText={(texto) => formulario.cambiar(campo, texto)}
        multiline={!!multilinea}
        maxLength={multilinea ? 2000 : undefined}
        disabled={formulario.enviando}
        error={!!error}
        accessibilityHint={error}
        testID={testID}
      />
      <ErrorCampo mensaje={error} testID={`${testID}-error`} />
      {ayuda && !error && <HelperText type="info">{ayuda}</HelperText>}
    </View>
  );
}

function Publicar({ formulario, subiendoImagen }) {
  return (
    <>
      {formulario.resumen && (
        <HelperText type="error" visible testID="evento-error">
          {formulario.resumen}
        </HelperText>
      )}
      <Button
        mode="contained"
        icon="calendar-check"
        onPress={() => {
          formulario.publicar();
        }}
        loading={formulario.enviando}
        disabled={formulario.enviando || subiendoImagen}
        testID="evento-guardar"
      >
        Publicar evento
      </Button>
    </>
  );
}

function useFormularioConFoco() {
  const foco = useFoco();
  const formulario = useFormularioEvento({
    alMarcarErrores: (claves) => {
      foco.anunciar(resumenDeErrores(claves.length));
      foco.enfocar(claves[0]);
    },
  });
  return { foco, formulario };
}

function DatosDelEvento({ formulario, foco }) {
  const { valores, errores, cambiar, enviando } = formulario;
  return (
    <>
      {TEXTOS.map((definicion) => (
        <CampoTexto
          key={definicion.campo}
          definicion={definicion}
          formulario={formulario}
          foco={foco}
        />
      ))}
      <SelectorCategoria
        categoria={valores.categoria}
        onElegir={(categoria) => cambiar("categoria", categoria)}
        deshabilitado={enviando}
        error={errores.categoria}
        foco={foco}
      />
      <SelectorFechaHora
        dia={valores.dia}
        hora={valores.hora}
        onDia={(dia) => cambiar("dia", dia)}
        onHora={(hora) => cambiar("hora", hora)}
        deshabilitado={enviando}
        errores={errores}
        foco={foco}
      />
    </>
  );
}

export default function CrearEvento() {
  const { foco, formulario } = useFormularioConFoco();
  const { valores, cambiar, enviando } = formulario;
  const subida = useSubidaDeImagen((url) => cambiar("imagen", url));
  return (
    <>
      <Pantalla scroll refScroll={foco.scroll}>
        <SelectorImagen url={valores.imagen} subida={subida} deshabilitado={enviando} />
        <DatosDelEvento formulario={formulario} foco={foco} />
        <TiposDeEntrada formulario={formulario} deshabilitado={enviando} foco={foco} />
        <Publicar formulario={formulario} subiendoImagen={subida.subiendo} />
      </Pantalla>
      <Snackbar
        visible={!!formulario.aviso}
        onDismiss={formulario.cerrarAviso}
        testID="evento-aviso-error"
      >
        {formulario.aviso ?? ""}
      </Snackbar>
    </>
  );
}

const estilos = StyleSheet.create({ campo: { gap: espaciado.xs } });
