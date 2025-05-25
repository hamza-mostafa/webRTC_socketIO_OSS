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
