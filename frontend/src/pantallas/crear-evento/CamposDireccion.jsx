import { StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { CampoNumero } from "../../components/CampoNumero";
import { espaciado } from "../../tema/espaciado";
import { ConfirmarUbicacion } from "./ConfirmarUbicacion";
import { ErrorCampo } from "./ErrorCampo";
import { SelectorProvincia } from "./SelectorProvincia";
import { useBusquedaDireccion } from "./useBusquedaDireccion";

const TEXTOS = [
  { campo: "calle", etiqueta: "Calle", ejemplo: "Ej.: Av. Corrientes" },
  { campo: "numero", etiqueta: "Número", ejemplo: "Ej.: 1234", numero: true },
  { campo: "localidad", etiqueta: "Localidad o barrio", ejemplo: "Ej.: Palermo" },
];

function CampoDireccion({ definicion, formulario, foco }) {
  const { campo, etiqueta, ejemplo, numero } = definicion;
  const error = formulario.errores[campo];
  const Entrada = numero ? CampoNumero : TextInput;
  return (
    <View {...foco.registrar(campo)}>
      <Entrada
        ref={foco.registrarEntrada(campo)}
        mode="outlined"
        label={etiqueta}
        placeholder={ejemplo}
        value={formulario.valores[campo]}
        onChangeText={(valor) => formulario.cambiar(campo, valor)}
        disabled={formulario.enviando}
        error={!!error}
        accessibilityHint={error}
        testID={`direccion-${campo}`}
      />
      <ErrorCampo mensaje={error} testID={`direccion-${campo}-error`} />
    </View>
  );
}

function Buscar({ formulario, foco }) {
  const busqueda = useBusquedaDireccion(formulario);
  const error = formulario.errores.ubicacion;
  return (
    <View {...foco.registrar("ubicacion")} style={estilos.bloque}>
      <Button
        mode="outlined"
        icon="map-search-outline"
        onPress={busqueda.buscar}
        loading={busqueda.buscando}
        disabled={busqueda.buscando || formulario.enviando}
        testID="direccion-buscar"
      >
        Ver en el mapa
      </Button>
      <ErrorCampo mensaje={error ?? busqueda.mensaje} testID="direccion-error" />
      {formulario.valores.ubicacion && (
        <ConfirmarUbicacion
          ubicacion={formulario.valores.ubicacion}
          onConfirmar={formulario.confirmarUbicacion}
          deshabilitado={formulario.enviando}
        />
      )}
    </View>
  );
}

export function CamposDireccion({ formulario, foco }) {
  const provincia = foco.registrar("provincia");
  return (
    <View style={estilos.bloque}>
      <Text variant="titleMedium">Dirección</Text>
      {TEXTOS.map((definicion) => (
        <CampoDireccion
          key={definicion.campo}
          definicion={definicion}
          formulario={formulario}
          foco={foco}
        />
      ))}
      <View onLayout={provincia.onLayout}>
        <SelectorProvincia
          provincia={formulario.valores.provincia}
          onElegir={(valor) => formulario.cambiar("provincia", valor)}
          error={formulario.errores.provincia}
          deshabilitado={formulario.enviando}
          nodo={provincia.ref}
        />
        <ErrorCampo mensaje={formulario.errores.provincia} testID="direccion-provincia-error" />
        <HelperText type="info">Buscá la dirección y confirmá en el mapa que es ahí.</HelperText>
      </View>
      <Buscar formulario={formulario} foco={foco} />
    </View>
  );
}

const estilos = StyleSheet.create({ bloque: { gap: espaciado.sm } });
