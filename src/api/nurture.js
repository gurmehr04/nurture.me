const API = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export async function getMentalMeta() {
  const r = await fetch(`${API}/meta/mental`);
  if (!r.ok) throw new Error(`meta failed: ${r.status}`);
  return r.json();
}

/**
 * Unified ML Analysis Endpoint (Proxied via Node Code)
 * Accepts: { text, sleep_hours, water_intake, physical_activity }
 */
export async function analyzeWellness(data) {
  const response = await fetch(`${API}/api/ml/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const resData = await response.json();
  if (!response.ok || !resData.success) {
    throw new Error(resData?.message || "Analysis failed");
  }

  return resData.data; // { sentiment: {...}, stress: {...} }
}

export async function sendFeedback(data) {
  const response = await fetch(`${API}/api/ml/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function saveMood(username, data) {
  const response = await fetch(`${API}/api/profile/${username}/mood`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Keeping these for legacy if needed, but they should ideally go through the proxy too if they exist.
// For this task, we focus on analyzeWellness.
export async function predictMental(body) {
  // Placeholder or Legacy
  return {};
}

export async function predictStress(vec) {
  // Placeholder or Legacy
  return {};
}

export async function predictTextSentiment(text) {
  // Redirect to new function for backward compatibility if needed, 
  // but better to update the caller.
  return analyzeWellness({ text });
}