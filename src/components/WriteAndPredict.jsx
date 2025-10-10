// src/components/WriteAndPredict.jsx
import { useState } from "react";
const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function WriteAndPredict() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(""); setResult(null);
    try {
      const r = await fetch(`${API}/predict/text-sentiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail || "Failed");
      setResult(data);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Write how you feel</h1>
      <form onSubmit={submit} className="space-y-3">
        <textarea className="w-full min-h-[160px] border rounded p-3"
          placeholder="tell us about your day…" value={text}
          onChange={(e) => setText(e.target.value)} required />
        <button className="border rounded px-4 py-2" disabled={busy}>
          {busy ? "Analyzing…" : "Analyze"}
        </button>
      </form>
      {error && <div className="text-red-600">{error}</div>}
      {result && <pre className="text-sm bg-black/5 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
