import { useEffect, useState } from "react";
import { api } from "./api";

export default function Transactions({ token, onAdded }) {
  const [txns, setTxns] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  const load = async () => {
    const data = await api("/transactions", { token });
    setTxns(data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api("/transactions", {
      method: "POST",
      token,
      body: {
        date: new Date().toISOString(),
        amount: Number(amount),
        category,
        note
      }
    });
    setAmount("");
    setCategory("");
    setNote("");
    await load();
    onAdded();
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Add transaction</h3>
      <form onSubmit={submit} style={{ marginBottom: 20 }}>
        <input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <input
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <button>Add</button>
      </form>

      <h3>Recent transactions</h3>
      <ul>
        {txns.map(t => (
          <li key={t.id}>
            ${t.amount} — {t.category} {t.note && `(${t.note})`}
          </li>
        ))}
      </ul>
    </div>
  );
}
