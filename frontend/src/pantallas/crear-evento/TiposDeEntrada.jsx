import { StyleSheet, View } from "react-native";
import { Button, IconButton, Surface, Text, TextInput } from "react-native-paper";
import { espaciado, radios } from "../../tema/espaciado";

const CAMPOS = [
  { campo: "nombre", etiqueta: "Nombre" },
  { campo: "precio", etiqueta: "Precio", teclado: "numeric" },
  { campo: "cupo", etiqueta: "Cupo", teclado: "numeric" },
  { campo: "descripcion", etiqueta: "Descripción (opcional)" },
];

function Tipo({ tipo, indice, puedeQuitar, deshabilitado, onCambiar, onQuitar }) {
  return (
    <Surface style={estilos.tipo} elevation={1} testID={`tipo-${indice}`}>
      <View style={estilos.encabezado}>
        <Text variant="titleSmall">{`Tipo ${indice + 1}`}</Text>
        {puedeQuitar && (
          <IconButton
            icon="close"
            disabled={deshabilitado}
            onPress={() => onQuitar(indice)}
            testID={`tipo-${indice}-quitar`}
            accessibilityLabel={`Quitar tipo ${indice + 1}`}
          />
        )}
      </View>
      {CAMPOS.map(({ campo, etiqueta, teclado }) => (
        <TextInput
          key={campo}
          mode="outlined"
          label={etiqueta}
          value={tipo[campo]}
          keyboardType={teclado ?? "default"}
          disabled={deshabilitado}
          onChangeText={(valor) => onCambiar(indice, campo, valor)}
          testID={`tipo-${indice}-${campo}`}
        />
      ))}
    </Surface>
  );
}

export function TiposDeEntrada({ formulario, deshabilitado }) {
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
          onCambiar={formulario.cambiarTipo}
          onQuitar={formulario.quitarTipo}
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
  tipo: { gap: espaciado.sm, padding: espaciado.md, borderRadius: radios.md },
  encabezado: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
