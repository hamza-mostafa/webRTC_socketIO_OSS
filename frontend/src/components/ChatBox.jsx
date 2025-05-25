import { useEffect, useState } from "react";

export default function ChatBox({ socket, match }) {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");

  // Only update chat state on server message
  useEffect(() => {
    const handleChat = (msg) => {
      console.log({msg});
      
      return setChat((prev) => {
        console.log({prev, msg});
        
        return [...prev, msg]
      })
    };
    socket.on("chat", handleChat);
    return () => socket.off("chat", handleChat);
  }, [socket]);

  // Send chat (no local setChat here!)
  const sendChat = e => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit("chat", { sessId: match.sessId, text: input });
    setInput("");
  };

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
      <form onSubmit={sendChat} style={{display:"flex",gap:6}}>
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