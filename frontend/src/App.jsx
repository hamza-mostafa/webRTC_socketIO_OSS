import { useState } from "react";
import AuthForm  from "./components/AuthForm";
import Lobby     from "./components/Lobby";
import VideoChat from "./components/VideoChat";
import useSocket from "./hooks/useSocket";

export default function App() {
  const [jwt, setJwt]               = useState(localStorage.getItem("jwt")||"");
  const [interest, setInterest]     = useState("Tech");
  const [phase, setPhase]           = useState(jwt ? "lobby" : "auth");
  const [queueMsg, setQueueMsg]     = useState("Queue");
  const [match, setMatch]           = useState(null);

  const socket = useSocket(jwt, {
    matched: data => { setMatch(data); setPhase("chat"); setQueueMsg("Connected"); },
    end    : ()   => { setPhase("lobby"); setQueueMsg("Queue"); setMatch(null); }
  });

  const onAuth = (token, intr) => {
    localStorage.setItem("jwt", token);
    setJwt(token);
    setInterest(interest);
    setPhase("lobby");
  };

  if (phase === "auth")
    return <AuthForm onAuth={onAuth} />;

  if (phase === "lobby")
    return <Lobby
             socket={socket}
             interest={interest}
             queueMsg={queueMsg}
             onQueue={()=>{ setQueueMsg("Waiting…"); socket.emit("queue"); }}
           />;

  return <VideoChat socket={socket} match={match} />;
}
