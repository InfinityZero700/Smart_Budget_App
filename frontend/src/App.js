import { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  if (!token) return <Login onAuthed={setToken} />;

  return <Dashboard token={token} />;
}
