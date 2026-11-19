import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { listarConversaciones } from "../api/conversacionesApi";
import { conectarSocket } from "../api/socket";
import { useAuth } from "../auth/AuthContext";

const SIN_BANDEJA = Object.freeze({ total: 0, version: 0, refrescar: () => {} });

const NoLeidosContext = createContext(SIN_BANDEJA);

export const textoBadge = (total) => {
  if (!total) return undefined;
  return total > 99 ? "99+" : total;
};

function useTotal(usuarioId) {
  const [conteo, setConteo] = useState({ usuarioId: null, total: 0 });
  const refrescar = useCallback(() => {
    if (usuarioId == null) return;
    listarConversaciones({ limit: 1 }).then(
      (pagina) => setConteo({ usuarioId, total: pagina.totalNoLeidos }),
      () => {},
    );
  }, [usuarioId]);
  useEffect(() => {
    refrescar();
  }, [refrescar]);
  useEffect(() => {
    const suscripcion = AppState.addEventListener("change", (estado) => {
      if (estado === "active") refrescar();
    });
    return () => suscripcion?.remove();
  }, [refrescar]);
  const total = conteo.usuarioId === usuarioId ? conteo.total : 0;
  return { total, refrescar };
}

function useNovedades(usuarioId, alLlegar) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (usuarioId == null) return undefined;
    const socket = conectarSocket();
    socket.on("conversacion:actualizada", () => {
      setVersion((v) => v + 1);
      alLlegar();
    });
    return () => {
      socket.off();
      socket.disconnect();
    };
  }, [usuarioId, alLlegar]);
  return version;
}

export function NoLeidosProvider({ children }) {
  const { usuario } = useAuth();
  const usuarioId = usuario?.id ?? null;
  const { total, refrescar } = useTotal(usuarioId);
  const version = useNovedades(usuarioId, refrescar);
  const valor = useMemo(() => ({ total, version, refrescar }), [total, version, refrescar]);
  return <NoLeidosContext.Provider value={valor}>{children}</NoLeidosContext.Provider>;
}

export const useNoLeidos = () => useContext(NoLeidosContext);
