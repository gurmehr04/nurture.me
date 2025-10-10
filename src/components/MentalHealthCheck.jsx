import { useEffect, useState } from "react";
import { getMentalMeta, predictMental } from "../api/nurture";

export default function MentalHealthCheck() {
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    getMentalMeta()
      .then((m) => {
        setMeta(m);
        const init = {};
        (m.feature_names || []).forEach((f) => (init[f] = ""));
        setForm(init);
      })
      .catch(() => setError("Could not load model schema"));
  }, []);

  const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(""); setResult(null);
    try {
      const body = {};
      for (const k of Object.keys(form)) {
        const v = form[k];
        body[k] = v === "" ? null : (isFinite(v) && v !== null && v !== "" ? Number(v) : v);
      }
      const data = await predictMental(body);
      setResult(data);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  };

  if (!meta) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Mental Health Prediction</h1>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submit}>
        {meta.feature_names.map((name) => {
          const choices = meta.categorical_encoders[name];
          return (
            <div key={name} className="flex flex-col">
              <label className="text-sm font-medium mb-1">{name}</label>
              {Array.isArray(choices) ? (
                <select className="border rounded p-2" required
                        value={form[name] ?? ""}
                        onChange={(e) => handleChange(name, e.target.value)}>
                  <option value="" disabled>Choose…</option>
                  {choices.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input type="number" className="border rounded p-2" required
                       value={form[name] ?? ""}
                       onChange={(e) => handleChange(name, e.target.value)} />
              )}
            </div>
          );
        })}
        <button disabled={busy} className="md:col-span-2 border rounded p-2" type="submit">
          {busy ? "Predicting…" : "Predict"}
        </button>
      </form>

      {error && <div className="text-red-600">{error}</div>}

      {result && (
        <div className="border rounded p-4 space-y-2">
          <div><b>Prediction:</b> {result.prediction}</div>
          {result.proba && result.classes && (
            <ul className="list-disc pl-6">
              {result.proba.map((p, i) => (
                <li key={i}>{result.classes[i]}: {Number(p).toFixed(4)}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
