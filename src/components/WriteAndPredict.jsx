import { useState, useMemo } from "react";
import { predictTextSentiment } from "../api/nurture";

// --- Fallbacks if backend doesn't send a summary/emotion
const msgByLabel = {
  negative:
    "That sounds really hard. You didn’t deserve that. Consider talking to someone you trust — you deserve kindness and care.",
  neutral: "Noted. Your mood seems steady. Add more context if you'd like.",
  positive: "Nice — there are some good feelings here. Let’s note what helped.",
};
const safeSummary = (api) => api?.summary ?? msgByLabel[api?.label] ?? "Noted.";

// Optional: quick, supportive suggestions by emotion
const suggestionsByEmotion = {
  bullying: [
    "Tell a trusted person what happened (friend/parent/teacher).",
    "Write down the incident to keep a record.",
    "Block/report the person if this was online.",
  ],
  anxiety: [
    "Try box breathing: 4-in, 4-hold, 4-out, 4-hold (x4).",
    "List the top 1–2 things you can control right now.",
    "Short walk or stretch: 3–5 minutes.",
  ],
  fatigue: [
    "Drink water and step away from screens for 5 minutes.",
    "Plan a realistic bedtime target tonight.",
    "Pick one tiny task to finish, then rest.",
  ],
  loneliness: [
    "Message one person you like with a simple ‘hey’.",
    "Go where people are (library, café) even if you’re solo.",
    "Join one online community around an interest.",
  ],
  anger: [
    "Pause: inhale 4s, exhale 6s (x6).",
    "Write what you’d say — don’t send — wait 30 minutes.",
    "Channel it physically: brisk walk, 10 pushups, or shake it out.",
  ],
  sadness: [
    "Do one kind thing for yourself (warm shower, music).",
    "Name the feeling out loud; it often softens.",
    "Light activity for 10 minutes — movement helps.",
  ],
  apathy: [
    "Choose a 2-minute task (make tea, tidy one spot).",
    "Play a favorite song; notice any tiny spark.",
    "Step into daylight for a minute.",
  ],
  general: [
    "Jot one thing you need right now.",
    "Pick the smallest next step and do only that.",
  ],
};

export default function WriteAndPredict() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const canSubmit = text.trim().length >= 3 && !busy;
  const charCount = text.length;

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await predictTextSentiment(text.trim());
      setResult(res);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  // Ctrl/Cmd + Enter to submit
  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit(e);
  };

  const labelClass = useMemo(() => {
    if (!result?.label) return "text-gray-600";
    return result.label === "negative"
      ? "text-red-600"
      : result.label === "positive"
      ? "text-green-600"
      : "text-gray-600";
  }, [result]);

  const emotion = result?.emotion_detected || "general";
  const tips = suggestionsByEmotion[emotion] || suggestionsByEmotion.general;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Write how you feel</h1>

      <form onSubmit={submit} className="space-y-3">
        <textarea
          className="w-full min-h-[160px] border rounded p-3"
          placeholder="tell us about your day…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          required
        />
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{charCount} chars</span>
          <span>Press ⌘/Ctrl + Enter to analyze</span>
        </div>
        <button
          type="submit"
          className={`border rounded px-4 py-2 ${canSubmit ? "" : "opacity-60 cursor-not-allowed"}`}
          disabled={!canSubmit}
        >
          {busy ? "Analyzing…" : "Analyze"}
        </button>
      </form>

      {error && <div className="text-red-600">{error}</div>}

      {result && (
        <div className="bg-gray-50 p-4 rounded space-y-3">
          <p>
            <strong>Mood:</strong>{" "}
            <span className={labelClass}>{result.label ?? "—"}</span>
            {result.emotion_detected && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-800">
                {result.emotion_detected}
              </span>
            )}
          </p>

          <p className="italic">{safeSummary(result)}</p>

          {/* Quick suggestions */}
          {tips?.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700 mb-1">Try now:</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw JSON for debugging */}
          <pre className="text-sm bg-black/5 p-3 rounded overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
