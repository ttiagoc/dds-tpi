import { router, useLocalSearchParams } from "expo-router";

export function useAvisoDeRuta(avisos) {
  const { aviso } = useLocalSearchParams();
  const texto = avisos[aviso] ?? null;
  const cerrar = () => {
    if (texto) router.setParams({ aviso: undefined });
  };
  return { texto, cerrar };
}
