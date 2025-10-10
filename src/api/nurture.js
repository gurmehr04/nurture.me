const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export async function getMentalMeta() {
  const r = await fetch(`${API}/meta/mental`);
  if (!r.ok) throw new Error(`meta failed: ${r.status}`);
  return r.json();
}

export async function predictMental(body) {
  const r = await fetch(`${API}/predict/mental-health`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.detail ?? "prediction failed");
  return data;
}

export async function predictStress(vec) {
  const r = await fetch(`${API}/predict/stress`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features: vec }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.detail ?? "stress failed");
  return data;
}

export async function predictHabit(vec) {
  const r = await fetch(`${API}/predict/habit`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features: vec }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.detail ?? "habit failed");
  return data;
}
