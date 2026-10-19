import { useState } from "react";
import { api } from "./api";

export default function Login({ onAuthed }) {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { token } = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      localStorage.setItem("token", token);
      onAuthed(token);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", fontFamily: "Arial" }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 10 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: "100%", padding: 10 }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" style={{ width: "100%", padding: 10 }} />
        </div>
        <button style={{ width: "100%", padding: 10 }}>Login</button>
        {err && <p style={{ color: "red" }}>{err}</p>}
      </form>
    </div>
  );
}
