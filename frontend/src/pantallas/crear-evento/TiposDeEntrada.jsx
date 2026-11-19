import { StyleSheet, View } from "react-native";
import { TarjetaPlana } from "../../components/TarjetaPlana";
import { Button, IconButton, Text, TextInput, useTheme } from "react-native-paper";
import { espaciado } from "../../tema/espaciado";

const CAMPOS = [
  { campo: "nombre", etiqueta: "Nombre" },
  { campo: "precio", etiqueta: "Precio", teclado: "numeric" },
  { campo: "cupo", etiqueta: "Cupo", teclado: "numeric" },
  { campo: "descripcion", etiqueta: "Descripción (opcional)" },
];

function Tipo({ tipo, indice, puedeQuitar, deshabilitado, onCambiar, onQuitar }) {
  const { colors } = useTheme();
  return (
    <TarjetaPlana style={estilos.tipo} testID={`tipo-${indice}`}>
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
    </TarjetaPlana>
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
  tipo: { gap: espaciado.sm, padding: espaciado.md },
  encabezado: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
