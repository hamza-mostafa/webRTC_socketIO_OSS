import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export const WS = "ws://localhost:5002";

export default function useSocket(jwt, handlers = {}) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!jwt) return;
    const s = io(WS, { auth: { token: jwt } });
    Object.entries(handlers).forEach(([evt, fn]) => s.on(evt, fn));
    setSocket(s);
    return () => s.disconnect();
  }, [jwt]);

  return socket;
}
