import { useState } from "react";
import { post } from "../api";

export default function AuthForm({ onAuth }) {
  const [email,    setEmail]    = useState("test1@a.com");
  const [password, setPassword] = useState("pass123");
  const [interest, setInterest] = useState("Tech");

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      // 1) try login
      const login = await post("login", { email, password });
      let token;

      if (login.ok && login.data.token) {
        token = login.data.token;
      } else if (login.status === 401) {
        // 2) fallback to signup
        const signup = await post("signup", {
          email,
          password,
          interests: [interest],
        });
        if (signup.ok && signup.data.token) {
          token = signup.data.token;
        } else {
          throw new Error("Signup failed");
        }
      } else {
        throw new Error("Login failed");
      }

      // 3) call onAuth → App.jsx will setPhase("lobby")
      onAuth(token, interest);
    } catch (err) {
      console.error("Auth error:", err);
      alert("Authentication failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={box}>
      <h3 style={{ textAlign: "center" }}>Speed Connect</h3>
      <input
        style={inp}
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        style={inp}
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <input
        style={inp}
        placeholder="Interest"
        value={interest}
        onChange={e => setInterest(e.target.value)}
      />
      <button style={btn} type="submit">Login / Signup</button>
    </form>
  );
}

const box = {
  maxWidth: 320,
  margin: "60px auto",
  padding: 20,
  border: "1px solid #ccc",
  borderRadius: 8,
};
const inp = { width: "100%", margin: "6px 0", padding: 8 };
const btn = { width: "100%", padding: 10, marginTop: 10 };