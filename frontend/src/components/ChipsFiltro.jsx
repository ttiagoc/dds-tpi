import { useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Chip, IconButton, useTheme } from "react-native-paper";
import { espaciado, radios } from "../tema/espaciado";

const TOLERANCIA = 4;
const AVANCE = 0.7;

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
  return {
    hayMas: visible > 0 && contenido - visible - desplazado > TOLERANCIA,
    onLayout: (evento) => medir({ visible: evento.nativeEvent.layout.width }),
    onContentSizeChange: (ancho) => medir({ contenido: ancho }),
    onScroll: (evento) => medir({ desplazado: evento.nativeEvent.contentOffset.x }),
    avanzar: () =>
      fila.current?.scrollToOffset({ offset: desplazado + visible * AVANCE, animated: true }),
  };
}

function VerMas({ onPress, testID }) {
  const { colors } = useTheme();
  return (
    <View style={estilos.verMas} pointerEvents="box-none">
      <IconButton
        icon="chevron-right"
        size={18}
        mode="outlined"
        containerColor={colors.surface}
        style={{ borderColor: colors.outlineVariant }}
        onPress={onPress}
        accessibilityLabel="Ver más filtros"
        testID={testID}
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
      {desborde.hayMas && <VerMas onPress={desborde.avanzar} testID={`${prefijoTestID}-mas`} />}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { gap: espaciado.sm, paddingRight: espaciado.xxl },
  chip: { borderRadius: radios.pill },
  verMas: { position: "absolute", right: 0, top: 0, bottom: 0, justifyContent: "center" },
});
