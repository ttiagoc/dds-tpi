import { StyleSheet, View } from "react-native";
import { CampoNumero } from "../../components/CampoNumero";
import { TarjetaPlana } from "../../components/TarjetaPlana";
import { Button, IconButton, Text, TextInput } from "react-native-paper";
import { espaciado } from "../../tema/espaciado";
import { claveDeTipo } from "./armarEvento";
import { ErrorCampo } from "./ErrorCampo";

const CAMPOS = [
  { campo: "nombre", etiqueta: "Nombre" },
  { campo: "precio", etiqueta: "Precio", numero: { decimal: true } },
  { campo: "cupo", etiqueta: "Cupo", numero: { decimal: false } },
  { campo: "descripcion", etiqueta: "Descripción (opcional)" },
];

function CampoTipo({ definicion, tipo, indice, formulario, deshabilitado, foco }) {
  const { campo, etiqueta, numero } = definicion;
  const clave = claveDeTipo(indice, campo);
  const error = formulario.errores[clave];
  const testID = `tipo-${indice}-${campo}`;
  const Entrada = numero ? CampoNumero : TextInput;
  return (
    <View>
      <Entrada
        {...numero}
        ref={foco.registrarEntrada(clave)}
        mode="outlined"
        label={etiqueta}
        value={tipo[campo]}
        disabled={deshabilitado}
        error={!!error}
        accessibilityHint={error}
        onChangeText={(valor) => formulario.cambiarTipo(indice, campo, valor)}
        testID={testID}
      />
      <ErrorCampo mensaje={error} testID={`${testID}-error`} />
    </View>
  );
}

function Tipo({ tipo, indice, puedeQuitar, deshabilitado, formulario, foco }) {
  return (
    <TarjetaPlana style={estilos.tipo} testID={`tipo-${indice}`}>
      <View style={estilos.encabezado}>
        <Text variant="titleSmall">{`Tipo ${indice + 1}`}</Text>
        {puedeQuitar && (
          <IconButton
            icon="close"
            disabled={deshabilitado}
            onPress={() => formulario.quitarTipo(indice)}
            testID={`tipo-${indice}-quitar`}
            accessibilityLabel={`Quitar tipo ${indice + 1}`}
          />
        )}
      </View>
      {CAMPOS.map((definicion) => (
        <CampoTipo
          key={definicion.campo}
          definicion={definicion}
          tipo={tipo}
          indice={indice}
          formulario={formulario}
          deshabilitado={deshabilitado}
          foco={foco}
        />
      ))}
    </TarjetaPlana>
  );
}

export function TiposDeEntrada({ formulario, deshabilitado, foco }) {
  const { tipos } = formulario.valores;
  return (
    <View style={estilos.lista}>
      <Text variant="titleMedium">Tipos de entrada</Text>
      {tipos.map((tipo, indice) => (
        <Tipo
          key={tipo.clave}
          tipo={tipo}
          indice={indice}
          puedeQuitar={tipos.length > 1}
          deshabilitado={deshabilitado}
          formulario={formulario}
          foco={foco}
        />
      ))}
      <Button
        mode="text"
        icon="plus"
        disabled={!formulario.puedeAgregarTipo}
        onPress={formulario.agregarTipo}
        testID="tipo-agregar"
      >
        Agregar tipo
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espaciado.sm },
  tipo: { gap: espaciado.sm, padding: espaciado.md },
  encabezado: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
