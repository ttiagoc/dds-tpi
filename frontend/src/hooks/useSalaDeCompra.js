import { useEffect, useRef, useState } from "react";
import { conectarSocket } from "../api/socket";

export function useSalaDeCompra(compraId, eventos = {}, { alReconectar } = {}) {
  const [conectado, setConectado] = useState(false);
  const vigentes = useRef({ eventos, alReconectar });
  useEffect(() => {
    vigentes.current = { eventos, alReconectar };
  });

  useEffect(() => {
    const socket = conectarSocket();
    let perdida = false;
    const perder = () => {
      perdida = true;
      setConectado(false);
    };
    const unirse = () =>
      socket.emit("compra:unirse", { compraId }, (respuesta) => {
        if (!respuesta?.ok) return perder();
        setConectado(true);
        if (perdida) vigentes.current.alReconectar?.();
        perdida = false;
      });

    socket.on("connect", unirse);
    socket.on("disconnect", perder);
    socket.on("connect_error", perder);
    socket.onAny((evento, ...datos) => vigentes.current.eventos[evento]?.(...datos));
    return () => {
      socket.emit("compra:salir", { compraId });
      socket.off();
      socket.offAny();
      socket.disconnect();
    };
  }, [compraId]);

  return { conectado };
}
