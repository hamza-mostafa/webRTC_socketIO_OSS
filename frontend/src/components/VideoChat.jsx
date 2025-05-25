import { useRef, useEffect, useState } from "react";
import Peer from "simple-peer";
import ChatBox from "./ChatBox";

export default function VideoChat({ socket, match }) {
  const localVideo  = useRef();
  const remoteVideo = useRef();
  const peerRef     = useRef();

  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 min

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          socket.emit("endSession", { sessId: match.sessId });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebRTC peer
  useEffect(() => {
    let peer;
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.current.srcObject = stream;

      peer = new Peer({
        initiator: match.role === "caller",
        trickle: true,
        config: { iceServers: match.ice },
        stream,
      });
      peerRef.current = peer;

      peer.on("signal", data => socket.emit("signal", { to: match.partner, data }));
      socket.on("signal", ({ data }) => peer.signal(data));
      peer.on("stream", remoteStream => remoteVideo.current.srcObject = remoteStream);
    })();

    return () => {
      peerRef.current?.destroy();
      socket.off("signal");
    };
  }, []);

  // Format mm:ss
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  return (
    <div style={container}>
      <div style={videoPanel}>
        <div style={header}>
          <span>Role: {match.role}</span>
          <span style={timer}>{mm}:{ss}</span>
        </div>
        <video ref={localVideo}  autoPlay muted style={video} />
        <video ref={remoteVideo} autoPlay         style={{ ...video, marginTop: 8 }} />
      </div>
      <ChatBox socket={socket} peerRef={peerRef} match={match} />
    </div>
  );
}

// ...styles...

const container = {
  display:      "flex",
  gap:          40,
  padding:      20,
  maxWidth:     900,
  margin:       "40px auto",
  alignItems:   "flex-start",
  background:   "#f7f9fc",
  borderRadius: 12,
  boxShadow:    "0 4px 12px rgba(0,0,0,0.1)",
};

const videoPanel = {
  flex:         "1 1 60%",
  display:      "flex",
  flexDirection:"column",
  alignItems:   "center",
  background:   "#fff",
  padding:      16,
  borderRadius: 8,
  boxShadow:    "0 2px 8px rgba(0,0,0,0.05)",
};

const header = {
  width:        "100%",
  display:      "flex",
  justifyContent:"space-between",
  marginBottom: 12,
  fontSize:     18,
  fontWeight:   "500",
};

const timer = {
  fontFamily:   "monospace",
  color:        "#d32f2f",
};

const video = {
  width:        "100%",
  maxWidth:     360,
  borderRadius: 8,
  background:   "#000",
};