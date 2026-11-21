import { useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Chip, IconButton, useTheme } from "react-native-paper";
import { espaciado, radios } from "../tema/espaciado";

const TOLERANCIA = 4;
const AVANCE = 0.7;
const TAMANIO_FLECHA = 36;

function ChipFiltro({ seleccionado, onPress, testID, children }) {
  const { colors } = useTheme();
  const fondo = seleccionado ? colors.onSurface : colors.surface;
  const texto = seleccionado ? colors.surface : colors.onSurface;
  return (
    <Chip
      mode="outlined"
      selected={seleccionado}
      showSelectedCheck={false}
      style={[
        estilos.chip,
        { backgroundColor: fondo, borderColor: seleccionado ? fondo : colors.outlineVariant },
      ]}
      textStyle={{ color: texto }}
      onPress={onPress}
      testID={testID}
      accessibilityState={{ selected: seleccionado }}
    >
      {children}
    </Chip>
  );
}

function useDesborde(fila) {
  const [medidas, setMedidas] = useState({ visible: 0, contenido: 0, desplazado: 0 });
  const medir = (cambios) => setMedidas((actuales) => ({ ...actuales, ...cambios }));
  const { visible, contenido, desplazado } = medidas;
  const desplazarA = (offset) =>
    fila.current?.scrollToOffset({ offset: Math.max(0, offset), animated: true });
  return {
    hayMas: visible > 0 && contenido - visible - desplazado > TOLERANCIA,
    hayAnteriores: desplazado > TOLERANCIA,
    onLayout: (evento) => medir({ visible: evento.nativeEvent.layout.width }),
    onContentSizeChange: (ancho) => medir({ contenido: ancho }),
    onScroll: (evento) => medir({ desplazado: evento.nativeEvent.contentOffset.x }),
    avanzar: () => desplazarA(desplazado + visible * AVANCE),
    retroceder: () => desplazarA(desplazado - visible * AVANCE),
  };
}

const FLECHAS = {
  derecha: { icono: "chevron-right", etiqueta: "Ver más filtros", sufijo: "mas" },
  izquierda: { icono: "chevron-left", etiqueta: "Ver filtros anteriores", sufijo: "menos" },
};

function Flecha({ lado, onPress, prefijoTestID }) {
  const { colors } = useTheme();
  const { icono, etiqueta, sufijo } = FLECHAS[lado];
  return (
    <View style={[estilos.flecha, estilos[lado]]} pointerEvents="box-none">
      <IconButton
        icon={icono}
        size={20}
        mode="contained"
        containerColor={colors.onSurface}
        iconColor={colors.surface}
        style={estilos.botonFlecha}
        onPress={onPress}
        accessibilityLabel={etiqueta}
        testID={`${prefijoTestID}-${sufijo}`}
      />
    </View>
  );
}

const TODAS = { valor: null, etiqueta: "Todas" };

export function ChipsFiltro({ opciones, seleccionada, onElegir, prefijoTestID, alLlegarAlFinal }) {
  const fila = useRef(null);
  const desborde = useDesborde(fila);
  return (
    <View>
      <FlatList
        ref={fila}
        horizontal
        testID={`${prefijoTestID}-fila`}
        data={[TODAS, ...opciones]}
        keyExtractor={({ valor }) => String(valor)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.fila}
        onLayout={desborde.onLayout}
        onContentSizeChange={desborde.onContentSizeChange}
        onScroll={desborde.onScroll}
        scrollEventThrottle={100}
        onEndReached={alLlegarAlFinal}
        onEndReachedThreshold={0.5}
        renderItem={({ item: { valor, etiqueta } }) => (
          <ChipFiltro
            seleccionado={seleccionada === valor || (valor === null && seleccionada == null)}
            onPress={() => onElegir(valor === null || seleccionada === valor ? null : valor)}
            testID={`${prefijoTestID}-${valor === null ? "todas" : valor}`}
          >
            {etiqueta}
          </ChipFiltro>
        )}
      />
      {desborde.hayAnteriores && (
        <Flecha lado="izquierda" onPress={desborde.retroceder} prefijoTestID={prefijoTestID} />
      )}
      {desborde.hayMas && (
        <Flecha lado="derecha" onPress={desborde.avanzar} prefijoTestID={prefijoTestID} />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { gap: espaciado.sm, paddingHorizontal: TAMANIO_FLECHA },
  chip: { borderRadius: radios.pill },
  flecha: { position: "absolute", top: 0, bottom: 0, justifyContent: "center" },
  izquierda: { left: -espaciado.xs },
  derecha: { right: -espaciado.xs },
  botonFlecha: { width: TAMANIO_FLECHA, height: TAMANIO_FLECHA, margin: 0 },
});
