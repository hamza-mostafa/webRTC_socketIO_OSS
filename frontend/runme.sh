#!/usr/bin/env bash
# write_frontend_split.sh  –  run once from repo root
# Creates/overwrites the refactored React front-end files (api, hooks, components, App.jsx)

set -euo pipefail
ROOT=${1:-frontend/src}

# helper
make_file () { mkdir -p "$(dirname "$1")"; cat >"$1"; }

########## api.js
make_file "$ROOT/api.js" <<'JS'
const API = "http://localhost:4000/api";
export const api = (path, body) =>
  fetch(`${API}/${path}`, {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(body)
  }).then(r => r.ok ? r.json() : Promise.reject(r));
JS

########## hooks/useSocket.js
make_file "$ROOT/hooks/useSocket.js" <<'JS'
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
JS

########## components/AuthForm.jsx
make_file "$ROOT/components/AuthForm.jsx" <<'JSX'
import { useState } from "react";
import { api } from "../api";

export default function AuthForm({ onAuth }) {
  const [email,    setEmail]    = useState("test1@a.com");
  const [password, setPassword] = useState("pass123");
  const [interest, setInterest] = useState("Tech");

  const handleSubmit = async () => {
    try {
      const { token } =
        (await api("login",  { email, password })) ||
        (await api("signup", { email, password, interests:[interest] }));
      onAuth(token, interest);
    } catch { alert("Auth failed"); }
  };

  return (
    <div style={box}>
      <h3 style={{textAlign:"center"}}>Speed Connect</h3>
      <input style={inp} value={email}    onChange={e=>setEmail(e.target.value)} />
      <input style={inp} value={password} type="password" onChange={e=>setPassword(e.target.value)} />
      <input style={inp} value={interest} onChange={e=>setInterest(e.target.value)} />
      <button style={btn} onClick={handleSubmit}>Login / Signup</button>
    </div>
  );
}
const box = { maxWidth:320, margin:"60px auto", padding:20, border:"1px solid #ccc", borderRadius:8 };
const inp = { width:"100%", margin:"6px 0", padding:8 };
const btn = { width:"100%", padding:10, marginTop:10 };
JSX

########## components/Lobby.jsx
make_file "$ROOT/components/Lobby.jsx" <<'JSX'
export default function Lobby({ socket, onQueue, interest, queueMsg }) {
  return (
    <div style={box}>
      <h3>Lobby</h3>
      <div>Interest: <b>{interest}</b></div>
      <button style={btn} disabled={!socket} onClick={onQueue}>{queueMsg}</button>
      <div style={{ marginTop:10,color:"#666" }}>Open two tabs and click Queue.</div>
    </div>
  );
}
const box = { maxWidth:320, margin:"60px auto", padding:20, border:"1px solid #ccc", borderRadius:8 };
const btn = { width:"100%", padding:10, marginTop:10 };
JSX

########## components/ChatBox.jsx
make_file "$ROOT/components/ChatBox.jsx" <<'JSX'
export default function ChatBox({ chat, input, setInput, onSend }) {
  return (
    <div style={{ minWidth:260 }}>
      <h4>Chat</h4>
      <div style={log}>
        {chat.map((m,i)=>(
          <div key={i} style={{
            textAlign: m.sender==="me"?"right":"left",
            color:     m.sender==="me"?"#08c":"#444"
          }}>{m.text}</div>
        ))}
      </div>
      <form onSubmit={onSend} style={{display:"flex",gap:6}}>
        <input style={{flex:1,padding:8}}
               value={input}
               onChange={e=>setInput(e.target.value)} />
        <button type="submit" style={{padding:"0 16px"}}>Send</button>
      </form>
    </div>
  );
}
const log = { height:170, overflowY:"auto", background:"#f9f9f9",
             padding:12, borderRadius:6, marginBottom:10 };
JSX

########## components/VideoChat.jsx
make_file "$ROOT/components/VideoChat.jsx" <<'JSX'
import { useRef, useState, useEffect } from "react";
import Peer from "simple-peer";
import ChatBox from "./ChatBox";

export default function VideoChat({ socket, match }) {
  const localVideo  = useRef();
  const remoteVideo = useRef();
  const peerRef     = useRef();
  const [chat,  setChat]  = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
      localVideo.current.srcObject = stream;
      const peer = new Peer({
        initiator: match.role==="caller",
        trickle: true,
        config: { iceServers: match.ice },
        stream
      });
      peerRef.current = peer;
      peer.on("signal", d => socket.emit("signal", { to: match.partner, data:d }));
      socket.on("signal", ({ data }) => peer.signal(data));
      peer.on("stream", rs => { remoteVideo.current.srcObject = rs; });
      peer.on("data", d => setChat(c=>[...c,{sender:"peer",text:d.toString()}]));
    })();
    // cleanup listeners
    return () => socket.off("signal");
  }, []);

  const sendChat = e => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit("chat", { sessId: match.sessId, text: input });
    peerRef.current?.send(input);
    setChat(c=>[...c,{sender:"me",text:input}]);
    setInput("");
  };

  return (
    <div style={{display:"flex",gap:40,padding:20}}>
      <div>
        <h4>Video ({match.role})</h4>
        <video ref={localVideo}  autoPlay muted style={vid}/>
        <video ref={remoteVideo} autoPlay        style={{...vid,marginTop:8}}/>
      </div>
      <ChatBox chat={chat} input={input} setInput={setInput} onSend={sendChat}/>
    </div>
  );
}
const vid = { width:220,borderRadius:8,background:"#222" };
JSX

########## App.jsx (root)
make_file "$ROOT/App.jsx" <<'JSX'
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
    setInterest(intr);
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
JSX

echo "✅ Frontend files written under $ROOT"